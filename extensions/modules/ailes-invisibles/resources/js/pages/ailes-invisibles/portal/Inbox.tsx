import { Head, useForm, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PortalLayout from '../../../layouts/portal/portal-layout';
import { InboxShell } from '../../../components/messaging/InboxShell';
import { usePortalUrl } from '../../../hooks/use-portal-url';
import type { ConversationInboxItem, ConversationDetail, InboxCounts } from '@/types/ailes-invisibles';

type Props = {
    conversations: ConversationInboxItem[];
    selected_conversation: ConversationDetail | null;
    counts: InboxCounts;
};

export default function Inbox({ conversations, selected_conversation, counts }: Props) {
    const { t } = useTranslation();
    const p = usePortalUrl();
    const user = usePage().props.auth?.user as { id?: number; name?: string; email?: string } | undefined;
    const [createOpen, setCreateOpen] = useState(false);

    const form = useForm({ title: '' });

    const routes = {
        inbox: p('/chat/inbox'),
        show: (id: number) => p('/chat/inbox') + '?conversation=' + id,
        send: (id: number) => p(`/chat/${id}/messages`),
        archive: (id: number) => p(`/chat/${id}/archive`),
        unarchive: (id: number) => p(`/chat/${id}/unarchive`),
        download: (convId: number, msgId: number) => p(`/chat/${convId}/messages/${msgId}/download`),
        read: (id: number) => p(`/chat/${id}/read`),
        create: p('/chat'),
        addParticipant: (id: number) => p(`/chat/${id}/participants`),
        removeParticipant: (convId: number, participantId: number) => p(`/chat/${convId}/participants/${participantId}`),
        rename: (id: number) => p(`/chat/${id}/title`),
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(routes.create, {
            onSuccess: () => {
                setCreateOpen(false);
                form.reset();
            },
        });
    };

    return (
        <PortalLayout breadcrumbs={[{ title: t('ai.portal.messages') }]}>
            <Head title={t('ai.portal.chat_title')} />
            <div className="relative -m-4 flex-1 overflow-hidden">
                <div className="absolute inset-0 flex">
                    <div className="absolute top-2 right-4 z-10">
                        <Button size="sm" onClick={() => setCreateOpen(true)}>
                            <Plus className="h-4 w-4" />
                            {t('ai.conversations.new_conversation')}
                        </Button>
                    </div>
                    <InboxShell
                        conversations={conversations}
                        selectedConversation={selected_conversation}
                        counts={counts}
                        currentUser={{
                            type: 'Modules\\AilesInvisibles\\Models\\ClientUser',
                            id: (user as { id?: number })?.id ?? 0,
                            name: (user as { name?: string })?.name ?? '',
                            email: (user as { email?: string })?.email,
                        }}
                        routes={routes}
                    />
                </div>
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('ai.conversations.new_conversation')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitCreate} className="space-y-4">
                        <div>
                            <Label htmlFor="title">{t('ai.conversations.title')}</Label>
                            <Input
                                id="title"
                                value={form.data.title}
                                onChange={(e) => form.setData('title', e.target.value)}
                                placeholder={t('ai.conversations.title_placeholder')}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={form.processing}>
                            {t('ai.conversations.create')}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </PortalLayout>
    );
}
