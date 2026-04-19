import { router } from '@inertiajs/react';
import type { ZodSchema } from 'zod';

type InertiaSubmitOptions = {
    url: string;
    method: 'post' | 'patch' | 'put' | 'delete';
    preserveScroll?: boolean;
    onSuccess?: () => void;
    onError?: (errors: Record<string, string>) => void;
};

export function inertiaSubmit(options: InertiaSubmitOptions) {
    return (values: Record<string, string | number | boolean>) => {
        router.visit(options.url, {
            method: options.method,
            data: values,
            preserveScroll: options.preserveScroll ?? true,
            onSuccess: options.onSuccess,
            onError: options.onError,
        });
    };
}

export function zodValidator<T>(schema: ZodSchema<T>) {
    return ({ value }: { value: unknown }) => {
        const result = schema.safeParse(value);
        if (result.success) return;

        const errors: Record<string, string> = {};
        for (const issue of result.error.issues) {
            const key = issue.path.join('.');
            if (!errors[key]) {
                errors[key] = issue.message;
            }
        }
        return errors;
    };
}
