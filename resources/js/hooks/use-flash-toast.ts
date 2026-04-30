import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

export function useFlashToast(): void {
    const { t } = useTranslation();

    useEffect(() => {
        const cleanups = [
            // Flash toast messages from backend (Inertia::flash)
            router.on('flash', (event) => {
                const flash = (event as CustomEvent).detail?.flash;
                const data = flash?.toast as FlashToast | undefined;

                if (data) {
                    toast[data.type](data.message);
                }
            }),

            // Validation errors (422) — show first error
            router.on('error', (event) => {
                const errors = (event as CustomEvent).detail?.errors;

                if (errors && typeof errors === 'object') {
                    const firstError = Object.values(errors).flat()[0];

                    if (typeof firstError === 'string') {
                        toast.error(firstError);
                    }
                }
            }),

            // HTTP exceptions (403, 404, 500, etc.)
            router.on('httpException', (event) => {
                const exception = (event as CustomEvent).detail?.exception;
                const status = exception?.status ?? exception?.statusCode;

                if (status === 403) {
                    toast.error(t('errors.permission_denied'));
                } else if (status === 404) {
                    toast.error(t('errors.not_found'));
                } else if (status === 419) {
                    toast.error(t('errors.session_expired'));
                } else if (status && status >= 500) {
                    toast.error(t('errors.server_error_generic'));
                } else {
                    toast.error(t('errors.generic'));
                }
            }),

            // Network errors (no connectivity, CORS, etc.)
            router.on('networkError', () => {
                toast.error(t('errors.network'));
            }),
        ];

        return () => cleanups.forEach((fn) => fn());
    }, [t]);
}
