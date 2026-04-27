import { Head, router } from '@inertiajs/react';
import { useForm } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { zodValidator } from '@/lib/inertia-form';
import { confirmPasswordSchema } from '@/lib/schemas';
import { store } from '@/routes/password/confirm';

export default function ConfirmPassword() {
    const { t } = useTranslation();
    const form = useForm({
        defaultValues: { password: '' },
        validators: { onChange: zodValidator(confirmPasswordSchema) },
        onSubmit: ({ value }) => {
            router.post(store().url, value, { preserveScroll: true });
        },
    });

    return (
        <AuthLayout
            title={t('auth.confirm_password.title')}
            description={t('auth.confirm_password.description')}
        >
            <Head title={t('auth.confirm_password.head_title')} />

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    form.handleSubmit();
                }}
                className="flex w-full max-w-lg flex-col gap-4"
            >
                <form.Field name="password">
                    {(field) => (
                        <div>
                            <Input
                                type="password"
                                id="password"
                                value={field.state.value}
                                onChange={(e) =>
                                    field.handleChange(e.target.value)
                                }
                                onBlur={field.handleBlur}
                                placeholder={t('auth.confirm_password.password_placeholder')}
                                autoComplete="current-password"
                                autoFocus
                                className="h-14 rounded-full border-none bg-muted px-5 py-4 font-medium"
                            />
                            <InputError
                                message={
                                    field.state.meta.errors?.[0] as
                                        | string
                                        | undefined
                                }
                            />
                        </div>
                    )}
                </form.Field>

                <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                    {([canSubmit, isSubmitting]) => (
                        <Button
                            type="submit"
                            className="h-14 w-full rounded-full bg-foreground font-medium tracking-tight text-background hover:bg-foreground/90"
                            disabled={!canSubmit || isSubmitting}
                            data-test="confirm-password-button"
                        >
                            {isSubmitting && <Spinner />}
                            {t('auth.confirm_password.submit')}
                        </Button>
                    )}
                </form.Subscribe>
            </form>
        </AuthLayout>
    );
}
