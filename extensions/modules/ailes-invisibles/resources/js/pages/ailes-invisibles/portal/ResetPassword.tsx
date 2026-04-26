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
import { z } from 'zod';

const schema = z.object({
    token: z.string(),
    email: z.string().email(),
    password: z.string().min(8),
    password_confirmation: z.string().min(8),
}).refine((d) => d.password === d.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
});

export default function ResetPassword({ email, token }: { email: string; token: string }) {
    const { t } = useTranslation();

    const form = useForm({
        defaultValues: {
            token,
            email: email ?? '',
            password: '',
            password_confirmation: '',
        },
        validators: { onChange: zodValidator(schema) },
        onSubmit: ({ value }) => {
            router.post('/portal/reset-password', value);
        },
    });

    return (
        <AuthLayout title={t('ai.portal.reset_title')} description={t('ai.portal.reset_description')}>
            <Head title={t('ai.portal.reset_title')} />

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
                                autoComplete="new-password"
                                placeholder={t('ai.portal.new_password')}
                                className="h-14 rounded-full border-none bg-muted px-5 py-4 font-medium"
                            />
                            <InputError message={field.state.meta.errors?.[0] as string | undefined} />
                        </div>
                    )}
                </form.Field>

                <form.Field name="password_confirmation">
                    {(field) => (
                        <div>
                            <PasswordInput
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                onBlur={field.handleBlur}
                                autoComplete="new-password"
                                placeholder={t('ai.portal.confirm_password')}
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
                            {t('ai.portal.reset_password')}
                        </Button>
                    )}
                </form.Subscribe>
            </form>
        </AuthLayout>
    );
}
