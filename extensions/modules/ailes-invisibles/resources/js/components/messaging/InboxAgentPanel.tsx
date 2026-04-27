import { router } from '@inertiajs/react';
import { Archive, Undo2, Clock, Users, MessageCircle, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { ConversationDetail } from '@/types/ailes-invisibles';

type CurrentUser = {
    type: string;
    id: number;
    name: string;
    email?: string;
};

type Props = {
    conversation: ConversationDetail;
    currentUser: CurrentUser;
    archiveUrl: string;
    unarchiveUrl: string;
    isArchived: boolean;
    onClose: () => void;
    renameUrl?: string;
};

function getInitials(name: string) {
    return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
}

function formatEvent(event: string, actorName: string | null, t: (key: string, params?: Record<string, unknown>) => string): string {
    const who = actorName ?? t('ai.conversations.event_system');
    switch (event) {
        case 'created': return t('ai.conversations.event_created', { who });
        case 'message_sent': return t('ai.conversations.event_message_sent', { who });
        case 'file_attached': return t('ai.conversations.event_file_attached', { who });
        case 'participant_joined': return t('ai.conversations.event_participant_joined');
        case 'participant_left': return t('ai.conversations.event_participant_left');
        case 'archived': return t('ai.conversations.event_archived', { who });
        case 'unarchived': return t('ai.conversations.event_unarchived', { who });
        default: return event;
    }
}

export function InboxAgentPanel({ conversation, currentUser, archiveUrl, unarchiveUrl, isArchived, onClose, renameUrl }: Props) {
    const { t } = useTranslation();
    const [renameOpen, setRenameOpen] = useState(false);
    const [renameTitle, setRenameTitle] = useState(conversation.title ?? '');

    const clientParticipant = conversation.participants.find(
        p => p.participant_type === 'Modules\\AilesInvisibles\\Models\\ClientUser'
    );

    const handleRename = (e: React.FormEvent) => {
        e.preventDefault();
        if (renameUrl && renameTitle.trim()) {
            router.put(renameUrl, { title: renameTitle.trim() }, {
                preserveScroll: true,
                onSuccess: () => setRenameOpen(false),
            });
        }
    };

    return (
        <div className="w-[300px] shrink-0 border-l bg-background flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center border-b px-4 py-3">
                <span className="text-sm font-medium">{t('ai.conversations.details')}</span>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-5">
                    {/* Conversation info */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <MessageCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm truncate">
                                {conversation.title ?? t('ai.conversations.conversation_fallback')}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-[10px] capitalize">
                                {conversation.type}
                            </Badge>
                            <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {conversation.participants.length} {t('ai.conversations.participants').toLowerCase()}
                            </span>
                        </div>
                    </div>

                    <Separator />

                    {/* Customer info */}
                    {clientParticipant && (
                        <>
                            <div>
                                <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                    {t('ai.conversations.customer')}
                                </p>
                                <div className="flex items-start gap-3">
                                    <Avatar className="size-10">
                                        <AvatarFallback>{getInitials(clientParticipant.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-sm">{clientParticipant.name}</p>
                                        {clientParticipant.company_name && (
                                            <p className="text-xs text-muted-foreground">{clientParticipant.company_name}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <Separator />
                        </>
                    )}

                    {/* Participants */}
                    <div>
                        <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            {t('ai.conversations.participants')} ({conversation.participants.length})
                        </p>
                        <div className="space-y-2">
                            {conversation.participants.map((p) => (
                                <div key={p.id} className="flex items-center gap-2">
                                    <Avatar className="size-6">
                                        <AvatarFallback className="text-[10px]">{getInitials(p.name)}</AvatarFallback>
                                    </Avatar>
                                    <span className="flex-1 truncate text-sm">{p.name}</span>
                                    {p.participant_type === 'App\\Models\\User' && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{t('ai.conversations.staff')}</Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Archive/Unarchive + Edit */}
                    <div className="space-y-2">
                        {isArchived ? (
                            <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => router.post(unarchiveUrl)}>
                                <Undo2 className="h-3.5 w-3.5" />
                                {t('ai.conversations.unarchive')}
                            </Button>
                        ) : (
                            <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => router.post(archiveUrl)}>
                                <Archive className="h-3.5 w-3.5" />
                                {t('ai.conversations.archive')}
                            </Button>
                        )}
                        {renameUrl && (
                            <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setRenameOpen(true)}>
                                <Pencil className="h-3.5 w-3.5" />
                                {t('ai.conversations.edit_conversation')}
                            </Button>
                        )}
                    </div>

                    <Separator />

                    {/* Audit Log */}
                    <div>
                        <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {t('ai.conversations.audit_log')}
                        </p>
                        {conversation.audit_logs.length === 0 ? (
                            <p className="text-xs text-muted-foreground">{t('ai.conversations.no_audit_logs')}</p>
                        ) : (
                            <div className="space-y-2">
                                {conversation.audit_logs.map((log) => (
                                    <div key={log.id} className="flex flex-col gap-0.5">
                                        <p className="text-xs">{formatEvent(log.event, log.actor_name, t)}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>

            {/* Rename dialog */}
            <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('ai.conversations.edit_conversation')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleRename} className="space-y-4">
                        <Input
                            value={renameTitle}
                            onChange={(e) => setRenameTitle(e.target.value)}
                            placeholder={t('ai.conversations.title_placeholder')}
                            required
                        />
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setRenameOpen(false)}>
                                {t('ai.conversations.cancel')}
                            </Button>
                            <Button type="submit" size="sm">
                                {t('ai.conversations.save')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
