import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';
import { forwardRef } from 'react';

const Kbd = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground',
                    className,
                )}
                {...props}
            />
        );
    },
);

Kbd.displayName = 'Kbd';

export { Kbd };
