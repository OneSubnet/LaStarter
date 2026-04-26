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
import { registerSchema } from '@/lib/schemas';
import { login } from '@/routes';
import { store } from '@/routes/register';

export default function Register() {
    const { t } = useTranslation();
    const form = useForm({
        defaultValues: {
            name: '',
            email: '',
            password: '',
            password_confirmation: '',
        },
        validators: { onChange: zodValidator(registerSchema) },
        onSubmit: ({ value }) => {
            router.post(store().url, value, {
                preserveScroll: true,
            });
        },
    });

    const inputClass = 'h-14 rounded-full border-none bg-muted px-5 py-4 font-medium';

    return (
        <AuthLayout title={t('auth.register.title')}>
            <Head title={t('auth.register.head_title')} />

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    form.handleSubmit();
                }}
                className="flex w-full max-w-lg flex-col gap-4"
            >
                <form.Field name="name">
                    {(field) => (
                        <div>
                            <Input
                                type="text"
                                value={field.state.value}
                                onChange={(e) =>
                                    field.handleChange(e.target.value)
                                }
                                onBlur={field.handleBlur}
                                autoFocus
                                tabIndex={1}
                                autoComplete="name"
                                placeholder={t('auth.register.name_placeholder')}
                                className={inputClass}
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
                                tabIndex={2}
                                autoComplete="email"
                                placeholder={t('auth.register.email_placeholder')}
                                className={inputClass}
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
                                tabIndex={3}
                                autoComplete="new-password"
                                placeholder={t('auth.register.password_placeholder')}
                                className={inputClass}
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

                <form.Field name="password_confirmation">
                    {(field) => (
                        <div>
                            <Input
                                type="password"
                                value={field.state.value}
                                onChange={(e) =>
                                    field.handleChange(e.target.value)
                                }
                                onBlur={field.handleBlur}
                                tabIndex={4}
                                autoComplete="new-password"
                                placeholder={t('auth.register.confirm_password_placeholder')}
                                className={inputClass}
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
                            tabIndex={5}
                            disabled={!canSubmit || isSubmitting}
                            data-test="register-user-button"
                        >
                            {isSubmitting && <Spinner />}
                            {t('auth.register.submit')}
                        </Button>
                    )}
                </form.Subscribe>
            </form>

            <p className="mb-8 w-full text-center text-sm tracking-tight text-foreground/40">
                {t('auth.register.already_have_account')}{' '}
                <TextLink href={login()} tabIndex={6} className="underline">
                    {t('auth.register.log_in')}
                </TextLink>
            </p>
        </AuthLayout>
    );
}
