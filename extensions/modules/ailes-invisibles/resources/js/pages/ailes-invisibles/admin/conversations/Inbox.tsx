import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import Guard from '@/components/guard';
import { Button } from '@/components/ui/button';
import { InboxShell } from '../../../../components/messaging/InboxShell';
import { InboxAgentPanel } from '../../../../components/messaging/InboxAgentPanel';
import { NewConversationDialog } from '../../../../components/messaging/NewConversationDialog';
import {
    inbox as conversationsInbox,
    store as conversationsStore,
    archive as conversationsArchive,
    unarchive as conversationsUnarchive,
} from '@/routes/ai/conversations';
import { store as messagesStore } from '@/routes/ai/conversations/messages';
import type { ConversationInboxItem, ConversationDetail, InboxCounts } from '@/types/ailes-invisibles';

type ClientOption = {
    id: number;
    name: string;
    company_name: string | null;
    portal_user: { id: number; email: string } | null;
};

type Props = {
    conversations: ConversationInboxItem[];
    selected_conversation: ConversationDetail | null;
    clients: ClientOption[];
    counts: InboxCounts;
};

export default function Inbox({ conversations, selected_conversation, clients, counts }: Props) {
    const { t } = useTranslation();
    const teamSlug = (usePage().props.currentTeam as { slug: string } | undefined)?.slug ?? '';
    const user = usePage().props.auth?.user as { id: number; name: string; email?: string } | undefined;
    const [createOpen, setCreateOpen] = useState(false);
    const [agentPanelOpen, setAgentPanelOpen] = useState(true);

    const routes = {
        inbox: conversationsInbox({ current_team: teamSlug }).url,
        show: (id: number) => conversationsInbox({ current_team: teamSlug }).url + '?conversation=' + id,
        send: (id: number) => messagesStore({ current_team: teamSlug, conversation: id }).url,
        archive: (id: number) => conversationsArchive({ current_team: teamSlug, conversation: id }).url,
        unarchive: (id: number) => conversationsUnarchive({ current_team: teamSlug, conversation: id }).url,
        download: (convId: number, msgId: number) => `/${teamSlug}/ai/conversations/${convId}/messages/${msgId}/download`,
        read: (id: number) => `/${teamSlug}/ai/conversations/${id}/read`,
        create: conversationsStore({ current_team: teamSlug }).url,
        addParticipant: (id: number) => `/${teamSlug}/ai/conversations/${id}/participants`,
        removeParticipant: (convId: number, participantId: number) => `/${teamSlug}/ai/conversations/${convId}/participants/${participantId}`,
        rename: (id: number) => `/${teamSlug}/ai/conversations/${id}/title`,
    };

    const renameUrl = selected_conversation
        ? `/${teamSlug}/ai/conversations/${selected_conversation.id}/title`
        : undefined;

    const rightSidebar = agentPanelOpen && selected_conversation ? (
        <InboxAgentPanel
            conversation={selected_conversation}
            currentUser={{ type: 'App\\Models\\User', id: user?.id ?? 0, name: user?.name ?? '', email: user?.email }}
            archiveUrl={routes.archive(selected_conversation.id)}
            unarchiveUrl={routes.unarchive(selected_conversation.id)}
            isArchived={!!selected_conversation.archived_at}
            onClose={() => setAgentPanelOpen(false)}
            renameUrl={renameUrl}
        />
    ) : undefined;

    return (
        <AppLayout
            breadcrumbs={[{ title: t('ai.conversations.breadcrumb') }]}
            rightSidebar={rightSidebar}
        >
            <Head title={t('ai.conversations.breadcrumb')} />
            <div className="relative -m-4 flex-1 overflow-hidden">
                <div className="absolute inset-0 flex">
                    <div className="absolute top-2 right-4 z-10">
                        <Guard permission="ai.conversations.create">
                            <Button size="sm" onClick={() => setCreateOpen(true)}>
                                <Plus className="h-4 w-4" />
                                {t('ai.conversations.new_conversation')}
                            </Button>
                        </Guard>
                    </div>
                    <InboxShell
                        conversations={conversations}
                        selectedConversation={selected_conversation}
                        counts={counts}
                        currentUser={{ type: 'App\\Models\\User', id: user?.id ?? 0, name: user?.name ?? '', email: user?.email }}
                        routes={routes}
                        clients={clients}
                        canCreate
                        hideAgentPanel
                    />
                </div>
            </div>
            <NewConversationDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                clients={clients ?? []}
                createUrl={routes.create}
            />
        </AppLayout>
    );
}
