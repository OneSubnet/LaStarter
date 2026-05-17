import { router, usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';
import type { ListWidgetProps } from '@/types/dashboard';
import { timeAgo } from '@/lib/format';
import { WidgetWrapper } from './widget-wrapper';

export function ListWidget({ title, onRemove, data, noDataLabel, renderItem }: ListWidgetProps) {
    const items = data?.items as Record<string, unknown>[] | undefined;

    return (
        <WidgetWrapper title={title} onRemove={onRemove} hasData={!!items?.length} noDataLabel={noDataLabel}>
            {items && (
                <ul className="divide-border divide-y">
                    {items.map((item, i) => (
                        <li key={String(item.id ?? i)} className="py-2 first:pt-0 last:pb-0">
                            {renderItem ? renderItem(item) : <DefaultListItem item={item} />}
                        </li>
                    ))}
                </ul>
            )}
        </WidgetWrapper>
    );
}

function DefaultListItem({ item }: { item: Record<string, unknown> }) {
    const page = usePage<SharedData>();
    const teamSlug = page.props.currentTeam?.slug ?? '';

    const primary = String(item.user ?? item.title ?? item.name ?? '');
    const action = item.action ? String(item.action) : null;
    const createdAt = item.created_at ? String(item.created_at) : null;

    const handleClick = () => {
        if (item.action || item.module) {
            router.visit(`/${teamSlug}/settings/system`);
        }
    };

    const isClickable = !!(item.action || item.module);

    return (
        <button
            type="button"
            onClick={isClickable ? handleClick : undefined}
            className={`flex w-full items-center justify-between gap-2 text-left ${isClickable ? 'hover:bg-accent/50 -mx-1 cursor-pointer rounded px-1 transition-colors' : ''}`}
        >
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{primary}</p>
                {action && (
                    <p className="text-muted-foreground truncate text-xs">{action}</p>
                )}
            </div>
            {createdAt && (
                <span className="text-muted-foreground shrink-0 text-xs">{timeAgo(createdAt)}</span>
            )}
        </button>
    );
}
