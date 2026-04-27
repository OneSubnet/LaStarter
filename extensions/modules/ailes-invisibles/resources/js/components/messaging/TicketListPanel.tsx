import { MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ConversationInboxItem, InboxCounts } from '@/types/ailes-invisibles';

type FilterKey = 'active' | 'archived';

type Props = {
    conversations: ConversationInboxItem[];
    selectedId?: number;
    onSelect: (id: number) => void;
    activeFilter: FilterKey;
    onFilterChange: (key: FilterKey) => void;
    counts: InboxCounts;
    isMobile?: boolean;
};

function getInitials(name: string) {
    return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
}

function formatRelativeDate(dateStr: string | null, t: (key: string, params?: Record<string, unknown>) => string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('ai.conversations.time_now');
    if (diffMins < 60) return t('ai.conversations.time_m', { count: diffMins });
    if (diffHours < 24) return t('ai.conversations.time_h', { count: diffHours });
    if (diffDays < 7) return t('ai.conversations.time_d', { count: diffDays });
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export type { FilterKey };

export function TicketListPanel({
    conversations,
    selectedId,
    onSelect,
    activeFilter,
    onFilterChange,
    counts,
    isMobile,
}: Props) {
    const { t } = useTranslation();

    const getRespondingUser = (conv: ConversationInboxItem) => {
        const admin = conv.participants.find(p => p.participant_type === 'App\\Models\\User');
        return admin ? { name: admin.name } : null;
    };

    return (
        <div className={cn('flex flex-col border-r', isMobile ? 'w-full' : 'w-80 shrink-0')}>
            {/* Active / Archived switch */}
            <div className="flex shrink-0 items-center gap-1 border-b px-3 py-2">
                <button
                    type="button"
                    onClick={() => onFilterChange('active')}
                    className={cn(
                        'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                        activeFilter === 'active'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent',
                    )}
                >
                    {t('ai.conversations.inbox')}
                    {counts.active > 0 && (
                        <span className={cn(
                            'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]',
                            activeFilter === 'active' ? 'bg-primary-foreground/20' : 'bg-muted',
                        )}>
                            {counts.active}
                        </span>
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => onFilterChange('archived')}
                    className={cn(
                        'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                        activeFilter === 'archived'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent',
                    )}
                >
                    {t('ai.conversations.archived_tab')}
                    {counts.archived > 0 && (
                        <span className={cn(
                            'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]',
                            activeFilter === 'archived' ? 'bg-primary-foreground/20' : 'bg-muted',
                        )}>
                            {counts.archived}
                        </span>
                    )}
                </button>
            </div>

            <ScrollArea className="flex-1">
                {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <MessageSquare className="mb-2 h-8 w-8 opacity-30" />
                        <p className="text-sm">{t('ai.conversations.no_conversations')}</p>
                    </div>
                ) : (
                    conversations.map((conv) => {
                        const responding = getRespondingUser(conv);
                        const preview = conv.last_message?.type === 'file'
                            ? `📎 ${t('ai.conversations.file_attached')}`
                            : t('ai.conversations.encrypted_message');
                        const isSelected = conv.id === selectedId;
                        const isUnread = conv.unread_count > 0;

                        return (
                            <button
                                key={conv.id}
                                type="button"
                                onClick={() => onSelect(conv.id)}
                                className={cn(
                                    'flex w-full flex-col gap-1 border-b p-3 text-left transition-colors hover:bg-accent/50',
                                    isSelected && 'bg-accent',
                                    isUnread && 'bg-primary/5',
                                )}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className={cn('truncate text-sm', isUnread && 'font-semibold')}>
                                        {conv.title ?? t('ai.conversations.conversation_fallback')}
                                    </span>
                                    <span className="shrink-0 text-[10px] text-muted-foreground">
                                        {formatRelativeDate(conv.last_message_at ?? conv.created_at, t)}
                                    </span>
                                </div>
                                <p className={cn('line-clamp-2 text-xs', isUnread ? 'text-foreground/80' : 'text-muted-foreground')}>
                                    {preview}
                                </p>
                                <div className="flex items-center gap-2">
                                    {responding && (
                                        <div className="flex items-center gap-1">
                                            <div className="flex size-4 items-center justify-center rounded-full bg-muted text-[8px] font-medium">
                                                {getInitials(responding.name)}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground">{responding.name}</span>
                                        </div>
                                    )}
                                    {isUnread && (
                                        <span className="ml-auto shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                                            {conv.unread_count}
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })
                )}
            </ScrollArea>
        </div>
    );
}
