import { Head, Link, usePage } from '@inertiajs/react';
import { useForm as useTanStackForm } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AccountLayout from '@/layouts/account-layout';
import { inertiaSubmit, zodValidator } from '@/lib/inertia-form';
import { profileSchema } from '@/lib/schemas';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { t, i18n } = useTranslation();
    const { auth } = usePage().props;

    const availableLocales = [
        { value: 'en', label: 'English' },
        { value: 'fr', label: 'Français' },
    ];

    const form = useTanStackForm({
        defaultValues: {
            name: auth.user.name as string,
            email: auth.user.email as string,
            locale: (auth.user as { locale?: string }).locale || i18n.language || 'en',
        },
        validators: { onChange: zodValidator(profileSchema) },
        onSubmit: ({ value }) => {
            inertiaSubmit({
                url: ProfileController.update.url(),
                method: 'patch',
                preserveScroll: true,
            })(value as Record<string, string>);
        },
    });

    return (
        <AccountLayout
            breadcrumbs={[
                { title: t('settings.profile.title'), href: edit().url },
            ]}
        >
            <Head title={t('settings.profile.title')} />
            <h1 className="sr-only">{t('settings.profile.title')}</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title={t('settings.profile.info_title')}
                    description={t('settings.profile.info_description')}
                />

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit();
                    }}
                    className="space-y-6"
                >
                    <div className="grid gap-2">
                        <Label htmlFor="name">{t('settings.profile.name_label')}</Label>
                        <form.Field name="name">
                            {(field) => (
                                <>
                                    <Input
                                        id="name"
                                        className="mt-1 block w-full"
                                        value={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        onBlur={field.handleBlur}
                                        autoComplete="name"
                                        placeholder={t('settings.profile.name_placeholder')}
                                    />
                                    <InputError
                                        className="mt-2"
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
                        <Label htmlFor="email">{t('settings.profile.email_label')}</Label>
                        <form.Field name="email">
                            {(field) => (
                                <>
                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        value={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        onBlur={field.handleBlur}
                                        autoComplete="username"
                                        placeholder={t('settings.profile.email_placeholder')}
                                    />
                                    <InputError
                                        className="mt-2"
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
                        <Label htmlFor="locale">{t('settings.profile.locale_label')}</Label>
                        <form.Field name="locale">
                            {(field) => (
                                <Select
                                    value={field.state.value}
                                    onValueChange={(value) => {
                                        field.handleChange(value);
                                        i18n.changeLanguage(value);
                                    }}
                                >
                                    <SelectTrigger className="mt-1 w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableLocales.map((loc) => (
                                            <SelectItem key={loc.value} value={loc.value}>
                                                {loc.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </form.Field>
                        <p className="text-xs text-muted-foreground">
                            {t('settings.profile.locale_description')}
                        </p>
                    </div>

                    {mustVerifyEmail &&
                        auth.user.email_verified_at === null && (
                            <div>
                                <p className="-mt-4 text-sm text-muted-foreground">
                                    {t('settings.profile.unverified')}{' '}
                                    <Link
                                        href={send()}
                                        as="button"
                                        className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                    >
                                        {t('settings.profile.resend_verification')}
                                    </Link>
                                </p>
                                {status === 'verification-link-sent' && (
                                    <div className="mt-2 text-sm font-medium text-primary">
                                        {t('settings.profile.verification_sent')}
                                    </div>
                                )}
                            </div>
                        )}

                    <form.Subscribe
                        selector={(state) => [state.canSubmit, state.isSubmitting]}
                    >
                        {([canSubmit, isSubmitting]) => (
                            <div className="flex items-center gap-4">
                                <Button
                                    type="submit"
                                    disabled={!canSubmit || isSubmitting}
                                    data-test="update-profile-button"
                                >
                                    {isSubmitting ? t('settings.profile.saving') : t('settings.profile.save')}
                                </Button>
                            </div>
                        )}
                    </form.Subscribe>
                </form>
            </div>

            <DeleteUser />
        </AccountLayout>
    );
}
