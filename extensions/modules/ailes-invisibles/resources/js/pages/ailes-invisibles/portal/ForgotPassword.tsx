import { Head, router, usePage } from '@inertiajs/react';
import { useForm } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { zodValidator } from '@/lib/inertia-form';
import { z } from 'zod';

const schema = z.object({
    email: z.string().email(),
});

export default function ForgotPassword() {
    const { t } = useTranslation();
    const page = usePage();
    const status = (page.props.status as string | undefined) ?? null;

    const form = useForm({
        defaultValues: { email: '' },
        validators: { onChange: zodValidator(schema) },
        onSubmit: ({ value }) => {
            router.post('/portal/forgot-password', value, { preserveScroll: true });
        },
    });

    return (
        <AuthLayout title={t('ai.portal.forgot_title')} description={t('ai.portal.forgot_description')}>
            <Head title={t('ai.portal.forgot_title')} />

            {status && (
                <div className="mb-4 rounded-lg bg-muted p-3 text-center text-sm font-medium text-foreground">
                    {status}
                </div>
            )}

            <form
                onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}
                className="flex w-full max-w-lg flex-col gap-4"
            >
                <form.Field name="email">
                    {(field) => (
                        <div>
                            <Input
                                type="email"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                onBlur={field.handleBlur}
                                autoFocus
                                autoComplete="email"
                                placeholder={t('ai.portal.email')}
                                className="h-14 rounded-full border-none bg-muted px-5 py-4 font-medium"
                            />
                            <InputError message={field.state.meta.errors?.[0] as string | undefined} />
                        </div>
                    )}
                </form.Field>

                <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                    {([canSubmit, isSubmitting]) => (
                        <Button
                            type="submit"
                            className="h-14 w-full rounded-full bg-foreground font-medium tracking-tight text-background hover:bg-foreground/90"
                            disabled={!canSubmit || isSubmitting}
                        >
                            {isSubmitting && <Spinner />}
                            {t('ai.portal.send_reset_link')}
                        </Button>
                    )}
                </form.Subscribe>
            </form>

            <div className="w-full max-w-lg pt-4 text-center text-sm text-muted-foreground">
                <a href="/portal/login" className="hover:text-foreground underline underline-offset-4">
                    {t('ai.portal.back_to_login')}
                </a>
            </div>
        </AuthLayout>
    );
}
