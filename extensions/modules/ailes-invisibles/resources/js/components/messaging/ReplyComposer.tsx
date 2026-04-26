import { router } from '@inertiajs/react';
import { ChevronDown, Paperclip, Send, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Props = {
    conversationId?: number;
    participants: { participant_type: string; participant_id: number }[];
    sendUrl: string;
};

export function ReplyComposer({ participants, sendUrl }: Props) {
    const { t } = useTranslation();
    const fileRef = useRef<HTMLInputElement>(null);
    const [content, setContent] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [sending, setSending] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && !file) return;

        setSending(true);

        const iv = crypto.getRandomValues(new Uint8Array(12))
            .reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');

        const encryptedKeys = participants.map((p) => ({
            participant_type: p.participant_type,
            participant_id: p.participant_id,
            encrypted_key: btoa(`key-${p.participant_id}-${Date.now()}`),
        }));

        const textContent = content.trim() || '(file)';

        const formData = new FormData();
        formData.append('encrypted_content', textContent);
        formData.append('iv', iv);
        encryptedKeys.forEach((key, i) => {
            formData.append(`encrypted_keys[${i}][participant_type]`, key.participant_type);
            formData.append(`encrypted_keys[${i}][participant_id]`, String(key.participant_id));
            formData.append(`encrypted_keys[${i}][encrypted_key]`, key.encrypted_key);
        });
        if (file) formData.append('file', file);

        router.post(sendUrl, formData, {
            preserveScroll: true,
            onSuccess: () => {
                setContent('');
                setFile(null);
                if (fileRef.current) fileRef.current.value = '';
                router.visit(window.location.href, {
                    only: ['selected_conversation'],
                    preserveState: true,
                    preserveScroll: true,
                });
            },
            onFinish: () => setSending(false),
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submit(e);
        }
    };

    return (
        <form onSubmit={submit} className="shrink-0 border-t bg-background">
            {/* Attachment preview */}
            {file && (
                <div className="flex items-center gap-2 border-b px-4 py-2">
                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="flex-1 truncate text-xs text-muted-foreground">{file.name}</span>
                    <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            {/* Textarea */}
            <div className="p-3">
                <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('ai.conversations.type_message')}
                    className="min-h-[80px] resize-none border-0 shadow-none focus-visible:ring-0"
                    rows={3}
                />
            </div>

            {/* Action bar */}
            <div className="flex items-center justify-between border-t px-3 py-2">
                <div className="flex items-center gap-1">
                    <input
                        type="file"
                        ref={fileRef}
                        className="hidden"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => fileRef.current?.click()}
                    >
                        <Paperclip className="h-4 w-4" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-muted-foreground">
                                {t('ai.conversations.close')}
                                <ChevronDown className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuItem>{t('ai.conversations.close_resolved')}</DropdownMenuItem>
                            <DropdownMenuItem>{t('ai.conversations.close_spam')}</DropdownMenuItem>
                            <DropdownMenuItem>{t('ai.conversations.close_without_reply')}</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">
                        <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">⌘</kbd>
                        {' + '}
                        <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">Enter</kbd>
                    </span>
                    <Button type="submit" size="sm" disabled={sending || (!content.trim() && !file)} className="gap-1.5">
                        <Send className="h-3.5 w-3.5" />
                        {t('ai.conversations.send')}
                    </Button>
                </div>
            </div>
        </form>
    );
}
