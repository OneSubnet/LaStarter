import { Head, router } from '@inertiajs/react';
import { useForm } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
            >
                <div className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="password">{t('auth.confirm_password.password_label')}</Label>
                        <form.Field name="password">
                            {(field) => (
                                <>
                                    <PasswordInput
                                        id="password"
                                        value={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        onBlur={field.handleBlur}
                                        placeholder={t('auth.confirm_password.password_placeholder')}
                                        autoComplete="current-password"
                                        autoFocus
                                    />
                                    <InputError
                                        message={
                                            field.state.meta.errors?.[0] as
                                                | string
                                                | undefined
                                        }
                                    />
                                </>
                            )}
                        </form.Field>
                    </div>

                    <form.Subscribe
                        selector={(state) => [state.canSubmit, state.isSubmitting]}
                    >
                        {([canSubmit, isSubmitting]) => (
                            <div className="flex items-center">
                                <Button
                                    className="w-full"
                                    disabled={!canSubmit || isSubmitting}
                                    data-test="confirm-password-button"
                                >
                                    {isSubmitting && <Spinner />}
                                    {t('auth.confirm_password.submit')}
                                </Button>
                            </div>
                        )}
                    </form.Subscribe>
                </div>
            </form>
        </AuthLayout>
    );
}
