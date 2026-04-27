import { Download, FileIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MessageDetail } from '@/types/ailes-invisibles';

type Props = {
    message: MessageDetail;
    downloadUrl?: string;
};

function getInitials(name: string) {
    return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
}

export function MessageBubble({ message, downloadUrl }: Props) {
    const { t } = useTranslation();
    const isStaff = message.sender_type === 'App\\Models\\User';
    const isMine = message.is_mine;

    const content = message.content ?? (() => {
        try {
            return decodeURIComponent(escape(atob(message.encrypted_content)));
        } catch {
            return message.encrypted_content;
        }
    })();

    if (isMine) {
        return (
            <div className="flex justify-end py-1">
                <div className="max-w-[75%]">
                    {message.type === 'file' && message.file_name ? (
                        <div className="max-w-xs flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-3">
                            <FileIcon className="h-6 w-6 shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{message.file_name}</p>
                                {message.file_size && (
                                    <p className="text-xs text-muted-foreground">
                                        {message.file_size >= 1048576
                                            ? `${(message.file_size / 1048576).toFixed(1)} MB`
                                            : `${(message.file_size / 1024).toFixed(1)} KB`}
                                    </p>
                                )}
                            </div>
                            {downloadUrl && (
                                <a
                                    href={downloadUrl}
                                    className="shrink-0 rounded-md p-1.5 hover:bg-accent"
                                    download
                                >
                                    <Download className="h-4 w-4" />
                                </a>
                            )}
                        </div>
                    ) : (
                        <div className="whitespace-pre-wrap rounded-xl bg-primary/10 px-4 py-2.5 text-sm">
                            {content}
                        </div>
                    )}
                    <div className="mt-0.5 flex justify-end gap-2 px-1">
                        <span className="text-[10px] text-muted-foreground">
                            {new Date(message.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {message.read_receipts.length > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                                {t('ai.conversations.read_by')} {message.read_receipts.length}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-2.5 py-1">
            <Avatar className="mt-0.5 size-8 shrink-0">
                <AvatarFallback className="text-[10px]">
                    {getInitials(message.sender_name)}
                </AvatarFallback>
            </Avatar>
            <div className="max-w-[75%]">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{message.sender_name}</span>
                    {isStaff && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {t('ai.conversations.staff')}
                        </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                        {new Date(message.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                {message.type === 'file' && message.file_name ? (
                    <div className="mt-1 max-w-xs flex items-center gap-3 rounded-xl border px-4 py-3">
                        <FileIcon className="h-6 w-6 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{message.file_name}</p>
                            {message.file_size && (
                                <p className="text-xs text-muted-foreground">
                                    {message.file_size >= 1048576
                                        ? `${(message.file_size / 1048576).toFixed(1)} MB`
                                        : `${(message.file_size / 1024).toFixed(1)} KB`}
                                </p>
                            )}
                        </div>
                        {downloadUrl && (
                            <a
                                href={downloadUrl}
                                className="shrink-0 rounded-md p-1.5 hover:bg-accent"
                                download
                            >
                                <Download className="h-4 w-4" />
                            </a>
                        )}
                    </div>
                ) : (
                    <div className="mt-1 whitespace-pre-wrap rounded-xl bg-muted px-4 py-2.5 text-sm">
                        {content}
                    </div>
                )}

                {message.read_receipts.length > 0 && (
                    <p className="mt-0.5 px-1 text-[10px] text-muted-foreground">
                        {t('ai.conversations.read_by')} {message.read_receipts.length}
                    </p>
                )}
            </div>
        </div>
    );
}
