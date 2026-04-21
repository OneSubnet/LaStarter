import { Head, router } from '@inertiajs/react';
import { useForm } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
                className="flex flex-col gap-6"
            >
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="email">{t('auth.login.email_label')}</Label>
                        <form.Field name="email">
                            {(field) => (
                                <>
                                    <Input
                                        id="email"
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

                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">{t('auth.login.password_label')}</Label>
                            {canResetPassword && (
                                <TextLink
                                    href={request()}
                                    className="ml-auto text-sm"
                                    tabIndex={5}
                                >
                                    {t('auth.login.forgot_password')}
                                </TextLink>
                            )}
                        </div>
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
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder={t('auth.login.password_placeholder')}
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

                    <form.Field name="remember">
                        {(field) => (
                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    checked={field.state.value}
                                    onCheckedChange={(checked) =>
                                        field.handleChange(checked === true)
                                    }
                                    tabIndex={3}
                                />
                                <Label htmlFor="remember">{t('auth.login.remember_me')}</Label>
                            </div>
                        )}
                    </form.Field>

                    <form.Subscribe
                        selector={(state) => [state.canSubmit, state.isSubmitting]}
                    >
                        {([canSubmit, isSubmitting]) => (
                            <Button
                                type="submit"
                                className="mt-4 w-full"
                                tabIndex={4}
                                disabled={!canSubmit || isSubmitting}
                                data-test="login-button"
                            >
                                {isSubmitting && <Spinner />}
                                {t('auth.login.submit')}
                            </Button>
                        )}
                    </form.Subscribe>
                </div>

                {canRegister && (
                    <div className="text-center text-sm text-muted-foreground">
                        {t('auth.login.no_account')}{' '}
                        <TextLink href={register()} tabIndex={5}>
                            {t('auth.login.sign_up')}
                        </TextLink>
                    </div>
                )}
            </form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-primary">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}
