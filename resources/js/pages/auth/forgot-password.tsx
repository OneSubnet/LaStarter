import { Head, router } from '@inertiajs/react';
import { useForm } from '@tanstack/react-form';
import { LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AuthLayout from '@/layouts/auth-layout';
import { zodValidator } from '@/lib/inertia-form';
import { forgotPasswordSchema } from '@/lib/schemas';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    const { t } = useTranslation();
    const form = useForm({
        defaultValues: { email: '' },
        validators: { onChange: zodValidator(forgotPasswordSchema) },
        onSubmit: ({ value }) => {
            router.post(email().url, value, { preserveScroll: true });
        },
    });

    return (
        <AuthLayout
            title={t('auth.forgot_password.title')}
            description={t('auth.forgot_password.description')}
        >
            <Head title={t('auth.forgot_password.title')} />

            {status && (
                <div className="w-full max-w-lg text-center text-sm font-medium text-primary">
                    {status}
                </div>
            )}

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    form.handleSubmit();
                }}
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
                                autoComplete="off"
                                autoFocus
                                placeholder={t('auth.forgot_password.email_placeholder')}
                                className="h-14 rounded-full border-none bg-muted px-5 py-4 font-medium"
                            />
                            <InputError
                                message={field.state.meta.errors?.[0] as string | undefined}
                            />
                        </div>
                    )}
                </form.Field>

                <Button
                    type="submit"
                    className="h-14 w-full rounded-full bg-foreground font-medium tracking-tight text-background hover:bg-foreground/90"
                    disabled={!form.state.canSubmit || form.state.isSubmitting}
                    data-test="email-password-reset-link-button"
                >
                    {form.state.isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    {t('auth.forgot_password.submit')}
                </Button>
            </form>

            <p className="w-full text-center text-sm tracking-tight text-foreground/40">
                <TextLink href={login()}>{t('auth.forgot_password.login_link')}</TextLink>
            </p>
        </AuthLayout>
    );
}
