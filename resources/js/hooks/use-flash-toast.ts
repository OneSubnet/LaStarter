import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
    getCustomEventDetail,
    isObject,
    isObjectWithKeys,
    isString,
} from '@/lib/type-guards';
import type { FlashToast } from '@/types/ui';

type FlashDetail = { flash?: { toast?: FlashToast } };
type ErrorDetail = { errors?: Record<string, string | string[]> };
type ExceptionDetail = { exception?: { status?: number; statusCode?: number } };

export function useFlashToast(): void {
    const { t } = useTranslation();

    useEffect(() => {
        const cleanups = [
            // Flash toast messages from backend (Inertia::flash)
            router.on('flash', (event) => {
                const detail = getCustomEventDetail<FlashDetail>(event);
                const data = detail?.flash?.toast;

                if (data) {
                    toast[data.type](data.message);
                }
            }),

            // Validation errors (422) — show first error
            router.on('error', (event) => {
                const detail = getCustomEventDetail<ErrorDetail>(event);

                if (detail?.errors && isObject(detail.errors)) {
                    const firstError = Object.values(detail.errors).flat()[0];

                    if (isString(firstError)) {
                        toast.error(firstError);
                    }
                }
            }),

            // HTTP exceptions (403, 404, 500, etc.)
            router.on('httpException', (event) => {
                const detail = getCustomEventDetail<ExceptionDetail>(event);

                if (
                    isObjectWithKeys<{
                        exception: { status?: number; statusCode?: number };
                    }>(detail, ['exception'])
                ) {
                    const status =
                        detail.exception.status ?? detail.exception.statusCode;

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
