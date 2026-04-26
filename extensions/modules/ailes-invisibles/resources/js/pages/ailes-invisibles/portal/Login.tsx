import { Head, router } from '@inertiajs/react';
import { useForm } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { zodValidator } from '@/lib/inertia-form';
import { loginSchema } from '@/lib/schemas';

export default function Login() {
    const { t } = useTranslation();
    const form = useForm({
        defaultValues: {
            email: '',
            password: '',
        },
        validators: { onChange: zodValidator(loginSchema) },
        onSubmit: ({ value }) => {
            router.post('/portal/login', value, {
                preserveScroll: true,
            });
        },
    });

    return (
        <AuthLayout title={t('ai.portal.login_title')} description={t('ai.portal.login_description')}>
            <Head title={t('ai.portal.login_title')} />

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
                                autoFocus
                                tabIndex={1}
                                autoComplete="email"
                                placeholder={t('ai.portal.email')}
                                className="h-14 rounded-full border-none bg-muted px-5 py-4 font-medium"
                            />
                            <InputError message={field.state.meta.errors?.[0] as string | undefined} />
                        </div>
                    )}
                </form.Field>

                <form.Field name="password">
                    {(field) => (
                        <div>
                            <PasswordInput
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                onBlur={field.handleBlur}
                                tabIndex={2}
                                autoComplete="current-password"
                                placeholder={t('ai.portal.password')}
                                className="h-14 rounded-full border-none bg-muted px-5 py-4 font-medium"
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
                            tabIndex={3}
                            disabled={!canSubmit || isSubmitting}
                        >
                            {isSubmitting && <Spinner />}
                            {t('ai.portal.submit')}
                        </Button>
                    )}
                </form.Subscribe>

                <div className="text-center">
                    <a
                        href="/portal/forgot-password"
                        className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
                    >
                        {t('ai.portal.forgot_password')}
                    </a>
                </div>
            </form>
        </AuthLayout>
    );
}
