import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { Button } from '@/components/ui/button';

type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean;
};

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
    ({ loading = false, children, disabled, ...props }, ref) => {
        return (
            <Button ref={ref} disabled={disabled || loading} {...props}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </Button>
        );
    },
);

LoadingButton.displayName = 'LoadingButton';
