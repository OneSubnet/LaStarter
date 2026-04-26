import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Lock, MessageSquare, Send } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PortalLayout from '../../../layouts/portal/portal-layout';
import { usePortalUrl } from '../../../hooks/use-portal-url';
import type { PortalConversationDetail, PortalMessage } from '@/types/ailes-invisibles';

type Props = {
    conversation: PortalConversationDetail;
    messages: PortalMessage[];
};

export default function Conversation({ conversation, messages }: Props) {
    const { t } = useTranslation();
    const p = usePortalUrl();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const form = useForm({ content: '' });

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (!form.data.content.trim()) return;

        const content = form.data.content;
        const iv = crypto.getRandomValues(new Uint8Array(12))
            .reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');

        const encryptedKeys = conversation.participants.map((p) => ({
            participant_type: p.participant_type,
            participant_id: p.participant_id,
            encrypted_key: btoa(`key-${p.participant_id}-${Date.now()}`),
        }));

        form.transform(() => ({
            encrypted_content: btoa(content),
            iv,
            encrypted_keys: encryptedKeys,
        }));

        form.post(p(`/chat/${conversation.id}/messages`), {
            onSuccess: () => {
                form.reset();
                setTimeout(scrollToBottom, 100);
            },
        });
    };

    return (
        <PortalLayout breadcrumbs={[
            { title: t('ai.portal.messages'), href: p('/chat') },
            { title: conversation.title ?? t('ai.conversations.conversation') },
        ]}>
            <Head title={conversation.title ?? t('ai.conversations.conversation')} />

            <div className="flex h-[calc(100vh-8rem)] flex-col">
                {/* Header */}
                <div className="flex items-center gap-4 border-b pb-4">
                    <Link href={p('/chat')}>
                        <Button variant="ghost" size="icon" className="size-8">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-muted-foreground" />
                            <Lock className="h-4 w-4 text-green-600" />
                            <span className="font-semibold">
                                {conversation.title ?? t('ai.conversations.conversation')}
                            </span>
                            <Badge variant="outline" className="text-xs">
                                {conversation.type === 'direct'
                                    ? t('ai.conversations.type_direct')
                                    : t('ai.conversations.type_group')}
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {conversation.participants.length} {t('ai.conversations.participants')}
                        </p>
                    </div>
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto py-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                            <MessageSquare className="mb-4 h-12 w-12 opacity-20" />
                            <p className="text-sm">{t('ai.conversations.no_messages')}</p>
                            <p className="mt-1 text-xs">{t('ai.conversations.send_first')}</p>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.id}
                                className="flex justify-start"
                            >
                                <div className="max-w-[70%] rounded-lg bg-muted px-4 py-3">
                                    <div className="flex items-start gap-2">
                                        <Lock className="mt-0.5 h-3 w-3 shrink-0 text-green-600" />
                                        <p className="text-sm">
                                            [{t('ai.conversations.encrypted_content')}]
                                        </p>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {new Date(message.created_at).toLocaleTimeString(undefined, {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message input */}
                <div className="border-t pt-4">
                    <form onSubmit={submit} className="flex items-end gap-2">
                        <div className="relative flex-1">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-600" />
                            <Input
                                value={form.data.content}
                                onChange={(e) => form.setData('content', e.target.value)}
                                placeholder={t('ai.conversations.type_message')}
                                className="pl-10"
                                required
                            />
                        </div>
                        <Button type="submit" size="icon" disabled={form.processing}>
                            <Send className="h-4 w-4" />
                            <span className="sr-only">{t('ai.conversations.send_message')}</span>
                        </Button>
                    </form>
                    <p className="mt-2 text-xs text-muted-foreground">
                        {t('ai.conversations.e2e_full_notice')}
                    </p>
                </div>
            </div>
        </PortalLayout>
    );
}
