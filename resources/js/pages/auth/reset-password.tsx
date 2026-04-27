import { Head, router } from '@inertiajs/react';
import { useForm } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { zodValidator } from '@/lib/inertia-form';
import { resetPasswordSchema } from '@/lib/schemas';
import { update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
};

export default function ResetPassword({ token, email }: Props) {
    const { t } = useTranslation();
    const form = useForm({
        defaultValues: {
            email,
            password: '',
            password_confirmation: '',
        },
        validators: { onChange: zodValidator(resetPasswordSchema) },
        onSubmit: ({ value }) => {
            router.post(update().url, { ...value, token, email }, {
                preserveScroll: true,
            });
        },
    });

    const inputClass = 'h-14 rounded-full border-none bg-muted px-5 py-4 font-medium';

    return (
        <AuthLayout
            title={t('auth.reset_password.title')}
            description={t('auth.reset_password.description')}
        >
            <Head title={t('auth.reset_password.title')} />

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
                                autoComplete="email"
                                readOnly
                                placeholder={t('auth.reset_password.email_label')}
                                className={`${inputClass} opacity-60`}
                            />
                            <InputError message={field.state.meta.errors?.[0] as string | undefined} />
                        </div>
                    )}
                </form.Field>

                <form.Field name="password">
                    {(field) => (
                        <div>
                            <Input
                                type="password"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                onBlur={field.handleBlur}
                                autoComplete="new-password"
                                autoFocus
                                placeholder={t('auth.reset_password.password_placeholder')}
                                className={inputClass}
                            />
                            <InputError message={field.state.meta.errors?.[0] as string | undefined} />
                        </div>
                    )}
                </form.Field>

                <form.Field name="password_confirmation">
                    {(field) => (
                        <div>
                            <Input
                                type="password"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                onBlur={field.handleBlur}
                                autoComplete="new-password"
                                placeholder={t('auth.reset_password.confirm_password_placeholder')}
                                className={inputClass}
                            />
                            <InputError message={field.state.meta.errors?.[0] as string | undefined} />
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
                            data-test="reset-password-button"
                        >
                            {isSubmitting && <Spinner />}
                            {t('auth.reset_password.submit')}
                        </Button>
                    )}
                </form.Subscribe>
            </form>
        </AuthLayout>
    );
}
