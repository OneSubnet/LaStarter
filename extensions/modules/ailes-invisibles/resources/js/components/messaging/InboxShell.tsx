import { PanelRight } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import type { ConversationInboxItem, ConversationDetail, InboxCounts, MessageDetail } from '@/types/ailes-invisibles';
import { TicketListPanel, type FilterKey } from './TicketListPanel';
import { MessageThread } from './MessageThread';
import { ReplyComposer } from './ReplyComposer';
import { InboxAgentPanel } from './InboxAgentPanel';
import { InboxCommandPalette } from './InboxCommandPalette';
import { useConversationChannel } from './useConversationChannel';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    Inbox,
    Search,
    MoreHorizontal,
    MessageCircle,
} from 'lucide-react';

type InboxRoutes = {
    inbox: string;
    show: (id: number) => string;
    send: (id: number) => string;
    archive: (id: number) => string;
    unarchive: (id: number) => string;
    download: (convId: number, msgId: number) => string;
    read: (id: number) => string;
    create: string;
    addParticipant: (id: number) => string;
    removeParticipant: (convId: number, participantId: number) => string;
    rename: (id: number) => string;
};

type CurrentUser = {
    type: string;
    id: number;
    name: string;
    email?: string;
};

type Props = {
    conversations: ConversationInboxItem[];
    selectedConversation: ConversationDetail | null;
    counts: InboxCounts;
    currentUser: CurrentUser;
    routes: InboxRoutes;
    clients?: { id: number; name: string; company_name: string | null; portal_user: { id: number; email: string } | null }[];
    canCreate?: boolean;
    hideAgentPanel?: boolean;
};

export function InboxShell({ conversations, selectedConversation, counts, currentUser, routes, canCreate, hideAgentPanel }: Props) {
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const [activeFilter, setActiveFilter] = useState<FilterKey>('active');
    const [agentPanelOpen, setAgentPanelOpen] = useState(true);
    const [commandOpen, setCommandOpen] = useState(false);
    const [mobileTicketListOpen, setMobileTicketListOpen] = useState(false);
    const [liveMessages, setLiveMessages] = useState<Record<number, MessageDetail[]>>({});

    // Reset live messages when conversation changes
    useEffect(() => {
        setLiveMessages({});
    }, [selectedConversation?.id]);

    const handleIncomingMessage = useCallback((msg: MessageDetail) => {
        setLiveMessages((prev) => ({
            ...prev,
            [msg.id]: [msg],
        }));
    }, []);

    useConversationChannel({
        conversationId: selectedConversation?.id ?? null,
        onMessage: handleIncomingMessage,
    });

    const mergedMessages = useMemo(() => {
        if (!selectedConversation) return [];
        const server = selectedConversation.messages;
        const live = Object.values(liveMessages).flat();
        const combined = [...server, ...live];
        const seen = new Set<number>();
        return combined.filter((msg) => {
            if (seen.has(msg.id)) return false;
            seen.add(msg.id);
            return true;
        }).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }, [selectedConversation, liveMessages]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setCommandOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const filtered = conversations.filter((c) => {
        switch (activeFilter) {
            case 'active': return !c.archived_at;
            case 'archived': return !!c.archived_at;
            default: return !c.archived_at;
        }
    });

    const handleSelect = (id: number) => {
        if (isMobile) {
            setMobileTicketListOpen(false);
        }
        router.visit(routes.show(id), { only: ['selected_conversation'], preserveState: true, preserveScroll: true });
    };

    // --- Mobile ---
    if (isMobile) {
        return (
            <>
                <InboxCommandPalette
                    open={commandOpen}
                    onOpenChange={setCommandOpen}
                    conversations={conversations}
                    onSelect={handleSelect}
                    navItems={[]}
                    onNavChange={() => {}}
                />

                <div className="flex h-full flex-col">
                    {selectedConversation ? (
                        <div className="flex flex-1 flex-col overflow-hidden">
                            <div className="flex h-10 shrink-0 items-center justify-between border-b px-3">
                                <Button variant="ghost" size="sm" onClick={() => setMobileTicketListOpen(true)}>
                                    {t('ai.conversations.inbox')}
                                </Button>
                                <Button variant="ghost" size="icon" className="size-8" onClick={() => setAgentPanelOpen(true)}>
                                    <PanelRight className="h-4 w-4" />
                                </Button>
                            </div>
                            <MessageThread
                                messages={mergedMessages}
                                downloadUrl={(msgId) => routes.download(selectedConversation.id, msgId)}
                            />
                            <ReplyComposer
                                participants={selectedConversation.participants}
                                sendUrl={routes.send(selectedConversation.id)}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-1 items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <Inbox className="mx-auto mb-2 h-12 w-12 opacity-30" />
                                <p className="text-sm">{t('ai.conversations.no_conversation_selected')}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="fixed inset-x-0 bottom-0 z-40 flex h-14 items-center justify-around border-t bg-background">
                    <button type="button" className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground" onClick={() => setMobileTicketListOpen(true)}>
                        <Inbox className="h-5 w-5" />
                        {t('ai.conversations.inbox')}
                    </button>
                    <button type="button" className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground" onClick={() => setActiveFilter('archived')}>
                        <MessageCircle className="h-5 w-5" />
                        {t('ai.conversations.archived_tab')}
                    </button>
                    <button type="button" className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground" onClick={() => setCommandOpen(true)}>
                        <Search className="h-5 w-5" />
                        {t('ai.conversations.search')}
                    </button>
                    <button type="button" className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground">
                        <MoreHorizontal className="h-5 w-5" />
                        {t('ai.conversations.more')}
                    </button>
                </div>

                <Drawer open={mobileTicketListOpen} onOpenChange={setMobileTicketListOpen}>
                    <DrawerContent className="h-[85vh]">
                        <DrawerHeader className="border-b">
                            <DrawerTitle>{t('ai.conversations.inbox')}</DrawerTitle>
                        </DrawerHeader>
                        <div className="flex-1 overflow-hidden">
                            <TicketListPanel
                                conversations={filtered}
                                selectedId={selectedConversation?.id}
                                onSelect={handleSelect}
                                activeFilter={activeFilter}
                                onFilterChange={setActiveFilter}
                                counts={counts}
                                isMobile
                            />
                        </div>
                    </DrawerContent>
                </Drawer>

                {selectedConversation && (
                    <Drawer open={agentPanelOpen} onOpenChange={setAgentPanelOpen}>
                        <DrawerContent className="h-[70vh]">
                            <DrawerHeader className="border-b">
                                <DrawerTitle>{t('ai.conversations.details')}</DrawerTitle>
                            </DrawerHeader>
                            <div className="flex-1 overflow-hidden">
                                <InboxAgentPanel
                                    conversation={selectedConversation}
                                    currentUser={currentUser}
                                    archiveUrl={routes.archive(selectedConversation.id)}
                                    unarchiveUrl={routes.unarchive(selectedConversation.id)}
                                    isArchived={!!selectedConversation.archived_at}
                                    onClose={() => setAgentPanelOpen(false)}
                                    renameUrl={routes.rename(selectedConversation.id)}
                                />
                            </div>
                        </DrawerContent>
                    </Drawer>
                )}
            </>
        );
    }

    // --- Desktop ---
    return (
        <div className="flex h-full w-full overflow-hidden">
            <InboxCommandPalette
                open={commandOpen}
                onOpenChange={setCommandOpen}
                conversations={conversations}
                onSelect={handleSelect}
                navItems={[]}
                onNavChange={() => {}}
            />

            <TicketListPanel
                conversations={filtered}
                selectedId={selectedConversation?.id}
                onSelect={handleSelect}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                counts={counts}
            />

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                {selectedConversation ? (
                    <>
                        <MessageThread
                            messages={mergedMessages}
                            downloadUrl={(msgId) => routes.download(selectedConversation.id, msgId)}
                        />
                        <ReplyComposer
                            participants={selectedConversation.participants}
                            sendUrl={routes.send(selectedConversation.id)}
                        />
                    </>
                ) : (
                    <div className="flex flex-1 items-center justify-center text-muted-foreground">
                        <div className="text-center">
                            <Inbox className="mx-auto mb-2 h-12 w-12 opacity-30" />
                            <p className="text-sm">{t('ai.conversations.no_conversation_selected')}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Agent panel — only shown here for portal; admin uses layout rightSidebar prop */}
            {!hideAgentPanel && agentPanelOpen && selectedConversation && (
                <InboxAgentPanel
                    conversation={selectedConversation}
                    currentUser={currentUser}
                    archiveUrl={routes.archive(selectedConversation.id)}
                    unarchiveUrl={routes.unarchive(selectedConversation.id)}
                    isArchived={!!selectedConversation.archived_at}
                    onClose={() => setAgentPanelOpen(false)}
                    renameUrl={routes.rename(selectedConversation.id)}
                />
            )}
        </div>
    );
}
