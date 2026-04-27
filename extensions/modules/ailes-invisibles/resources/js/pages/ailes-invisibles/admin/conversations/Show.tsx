import { Head, useForm, usePage } from '@inertiajs/react';
import {
    Lock,
    MessageSquare,
    Send,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { index as conversationsIndex } from '@/routes/ai/conversations';
import { store as messagesStore } from '@/routes/ai/conversations/messages';
import type { Conversation, Message } from '@/types/ailes-invisibles';

type Props = {
    conversation: Conversation;
    messages: Message[];
};

export default function Show({ conversation, messages }: Props) {
    const { t } = useTranslation();
    const teamSlug = (usePage().props.currentTeam as { slug: string } | undefined)?.slug ?? '';
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const form = useForm({ content: '' });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sortedMessages = useMemo(
        () => [...(messages ?? [])].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
        [messages],
    );

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(
            messagesStore({ current_team: teamSlug, conversation: conversation.id }).url,
            {
                onSuccess: () => {
                    form.reset();
                    scrollToBottom();
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={[{ title: t('ai.conversations.breadcrumb'), href: conversationsIndex({ current_team: teamSlug }).url }, { title: conversation.title ?? t('ai.conversations.conversation') }]}>
            <Head title={conversation.title ?? t('ai.conversations.conversation')} />

            <div className="flex h-[calc(100vh-8rem)] flex-col">
                {/* Header */}
                <div className="flex items-center gap-4 border-b pb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-muted-foreground" />
                            <Lock className="h-4 w-4 text-green-600" />
                            <Badge variant="outline" className="text-xs">
                                {conversation.type === 'direct' ? t('ai.conversations.type_direct') : t('ai.conversations.type_group')}
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {(conversation.participants ?? []).map((p) => p.name).join(', ')}
                        </p>
                    </div>
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto py-4">
                    {(sortedMessages ?? []).length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                            <MessageSquare className="mb-4 h-12 w-12 opacity-20" />
                            <p className="text-sm">{t('ai.conversations.no_messages')}</p>
                            <p className="mt-1 text-xs">{t('ai.conversations.send_first')}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {(sortedMessages ?? []).map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.is_mine ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[70%] rounded-lg px-4 py-3 ${
                                            message.is_mine
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted'
                                        }`}
                                    >
                                        {!message.is_mine && (
                                            <p className="mb-1 text-xs font-semibold opacity-80">
                                                {message.sender_name}
                                            </p>
                                        )}
                                        <div className="flex items-start gap-2">
                                            <Lock className="mt-0.5 h-3 w-3 shrink-0 opacity-50" />
                                            <p className="text-sm">
                                                [{t('ai.conversations.encrypted_content')}]
                                            </p>
                                        </div>
                                        <p
                                            className={`mt-1 text-xs ${
                                                message.is_mine
                                                    ? 'text-primary-foreground/60'
                                                    : 'text-muted-foreground'
                                            }`}
                                        >
                                            {new Date(message.created_at).toLocaleTimeString(undefined, {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
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
        </AppLayout>
    );
}
