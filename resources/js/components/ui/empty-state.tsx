import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type EmptyStateProps = {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
};

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center',
                className,
            )}
        >
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">{title}</p>
            {description && (
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                    {description}
                </p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
