import { Head, router } from '@inertiajs/react';
import { useForm } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { zodValidator } from '@/lib/inertia-form';
import { loginSchema } from '@/lib/schemas';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    const { t } = useTranslation();
    const form = useForm({
        defaultValues: {
            email: '',
            password: '',
            remember: false as boolean,
        },
        validators: { onChange: zodValidator(loginSchema) },
        onSubmit: ({ value }) => {
            router.post(store().url, value, {
                preserveScroll: true,
            });
        },
    });

    return (
        <AuthLayout
            title={t('auth.login.title')}
            description={t('auth.login.description')}
        >
            <Head title={t('auth.login.head_title')} />

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
                                onChange={(e) =>
                                    field.handleChange(e.target.value)
                                }
                                onBlur={field.handleBlur}
                                autoFocus
                                tabIndex={1}
                                autoComplete="email"
                                placeholder={t('auth.login.email_placeholder')}
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

                <form.Field name="password">
                    {(field) => (
                        <div>
                            <Input
                                type="password"
                                value={field.state.value}
                                onChange={(e) =>
                                    field.handleChange(e.target.value)
                                }
                                onBlur={field.handleBlur}
                                tabIndex={2}
                                autoComplete="current-password"
                                placeholder={t('auth.login.password_placeholder')}
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
                            tabIndex={3}
                            disabled={!canSubmit || isSubmitting}
                            data-test="login-button"
                        >
                            {isSubmitting && <Spinner />}
                            {t('auth.login.submit')}
                        </Button>
                    )}
                </form.Subscribe>
            </form>

            {canResetPassword && (
                <TextLink
                    href={request()}
                    className="text-sm text-foreground/40 hover:text-foreground/60"
                    tabIndex={4}
                >
                    {t('auth.login.forgot_password')}
                </TextLink>
            )}

            {canRegister && (
                <p className="mb-8 w-full text-center text-sm tracking-tight text-foreground/40">
                    {t('auth.login.no_account')}{' '}
                    <TextLink href={register()} tabIndex={5} className="underline">
                        {t('auth.login.sign_up')}
                    </TextLink>
                </p>
            )}

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-primary">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}
