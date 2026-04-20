import { Head, router, usePage } from '@inertiajs/react';
import { useForm } from '@tanstack/react-form';
import { Mail } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import TeamSettingsLayout from '@/layouts/team-settings-layout';
import { inertiaSubmit, zodValidator } from '@/lib/inertia-form';
import { mailSettingsSchema } from '@/lib/schemas';
import { mail as mailUrl, update as updateUrl } from '@/routes/settings/team';
import { test as testUrl } from '@/routes/settings/team/mail';

type Props = {
    mail: {
        host: string;
        port: string;
        username: string;
        password: string;
        encryption: string;
        from_address: string;
        from_name: string;
    };
};

export default function TeamMail({ mail }: Props) {
    const { t } = useTranslation();
    const { currentTeam } = usePage().props;
    const teamSlug = (currentTeam as { slug: string } | null)?.slug ?? '';
    const [serverErrors, setServerErrors] = useState<Record<string, string>>(
        {},
    );
    const [sendingTest, setSendingTest] = useState(false);

    const form = useForm({
        defaultValues: {
            host: mail.host,
            port: parseInt(mail.port) || 587,
            username: mail.username,
            password: mail.password,
            encryption: (mail.encryption as 'tls' | 'ssl' | 'none') || 'tls',
            from_address: mail.from_address,
            from_name: mail.from_name,
        },
        validators: { onChange: zodValidator(mailSettingsSchema) },
        onSubmit: ({ value }) => {
            setServerErrors({});
            inertiaSubmit({
                url: updateUrl(teamSlug).url,
                method: 'patch',
                onSuccess: () => setServerErrors({}),
                onError: (errors) => setServerErrors(errors),
            })(value as Record<string, string | number | boolean>);
        },
    });

    const handleTestEmail = () => {
        setSendingTest(true);
        router.post(
            testUrl(teamSlug).url,
            {},
            {
                preserveScroll: true,
                onFinish: () => setSendingTest(false),
            },
        );
    };

    return (
        <TeamSettingsLayout
            activeTab="Mail"
            breadcrumbs={[
                { title: t('common.mail'), href: mailUrl(teamSlug).url },
            ]}
        >
            <Head title={t('settings.team.mail.title')} />
            <h1 className="sr-only">{t('settings.team.mail.title')}</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title={t('settings.team.mail.server_title')}
                    description={t('settings.team.mail.server_description')}
                />

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit();
                    }}
                    className="space-y-6"
                >
                    <div className="grid gap-2">
                        <Label htmlFor="host">{t('settings.team.mail.host_label')}</Label>
                        <form.Field name="host">
                            {(field) => (
                                <>
                                    <Input
                                        id="host"
                                        value={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        onBlur={field.handleBlur}
                                        placeholder={t('settings.team.mail.host_placeholder')}
                                    />
                                    <InputError
                                        message={
                                            field.state.meta.errors?.[0] as
                                                | string
                                                | undefined ??
                                            serverErrors.host
                                        }
                                    />
                                </>
                            )}
                        </form.Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="port">{t('settings.team.mail.port_label')}</Label>
                            <form.Field name="port">
                                {(field) => (
                                    <>
                                        <Input
                                            id="port"
                                            type="number"
                                            value={field.state.value}
                                            onChange={(e) =>
                                                field.handleChange(
                                                    parseInt(e.target.value) ||
                                                        0,
                                                )
                                            }
                                            onBlur={field.handleBlur}
                                            placeholder={t('settings.team.mail.port_placeholder')}
                                        />
                                        <InputError
                                            message={
                                                field.state.meta.errors?.[0] as
                                                    | string
                                                    | undefined ??
                                                serverErrors.port
                                            }
                                        />
                                    </>
                                )}
                            </form.Field>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="encryption">{t('settings.team.mail.encryption_label')}</Label>
                            <form.Field name="encryption">
                                {(field) => (
                                    <>
                                        <Select
                                            value={field.state.value}
                                            onValueChange={(val) =>
                                                field.handleChange(
                                                    val as
                                                        | 'tls'
                                                        | 'ssl'
                                                        | 'none',
                                                )
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="tls">
                                                    {t('settings.team.mail.encryption_tls')}
                                                </SelectItem>
                                                <SelectItem value="ssl">
                                                    {t('settings.team.mail.encryption_ssl')}
                                                </SelectItem>
                                                <SelectItem value="none">
                                                    {t('settings.team.mail.encryption_none')}
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={serverErrors.encryption}
                                        />
                                    </>
                                )}
                            </form.Field>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="username">{t('settings.team.mail.username_label')}</Label>
                            <form.Field name="username">
                                {(field) => (
                                    <>
                                        <Input
                                            id="username"
                                            value={field.state.value}
                                            onChange={(e) =>
                                                field.handleChange(e.target.value)
                                            }
                                            onBlur={field.handleBlur}
                                            placeholder={t('settings.team.mail.username_placeholder')}
                                            autoComplete="off"
                                        />
                                        <InputError
                                            message={serverErrors.username}
                                        />
                                    </>
                                )}
                            </form.Field>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">{t('settings.team.mail.password_label')}</Label>
                            <form.Field name="password">
                                {(field) => (
                                    <>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={field.state.value}
                                            onChange={(e) =>
                                                field.handleChange(e.target.value)
                                            }
                                            onBlur={field.handleBlur}
                                            placeholder={t('settings.team.mail.password_placeholder')}
                                            autoComplete="new-password"
                                        />
                                        <InputError
                                            message={serverErrors.password}
                                        />
                                    </>
                                )}
                            </form.Field>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="from_address">{t('settings.team.mail.from_address_label')}</Label>
                            <form.Field name="from_address">
                                {(field) => (
                                    <>
                                        <Input
                                            id="from_address"
                                            type="email"
                                            value={field.state.value}
                                            onChange={(e) =>
                                                field.handleChange(e.target.value)
                                            }
                                            onBlur={field.handleBlur}
                                            placeholder={t('settings.team.mail.from_address_placeholder')}
                                        />
                                        <InputError
                                            message={
                                                field.state.meta.errors?.[0] as
                                                    | string
                                                    | undefined ??
                                                serverErrors.from_address
                                            }
                                        />
                                    </>
                                )}
                            </form.Field>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="from_name">{t('settings.team.mail.from_name_label')}</Label>
                            <form.Field name="from_name">
                                {(field) => (
                                    <>
                                        <Input
                                            id="from_name"
                                            value={field.state.value}
                                            onChange={(e) =>
                                                field.handleChange(e.target.value)
                                            }
                                            onBlur={field.handleBlur}
                                            placeholder={t('settings.team.mail.from_name_placeholder')}
                                        />
                                        <InputError
                                            message={serverErrors.from_name}
                                        />
                                    </>
                                )}
                            </form.Field>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <form.Subscribe
                            selector={(state) => [state.canSubmit, state.isSubmitting]}
                        >
                            {([canSubmit, isSubmitting]) => (
                                <Button
                                    type="submit"
                                    disabled={!canSubmit || isSubmitting}
                                >
                                    {isSubmitting ? t('settings.team.mail.saving') : t('settings.team.mail.save')}
                                </Button>
                            )}
                        </form.Subscribe>

                        <Button
                            type="button"
                            variant="outline"
                            disabled={sendingTest}
                            onClick={handleTestEmail}
                        >
                            <Mail className="mr-2 h-4 w-4" />
                            {sendingTest ? t('settings.team.mail.test_sending') : t('settings.team.mail.test_button')}
                        </Button>
                    </div>
                </form>
            </div>
        </TeamSettingsLayout>
    );
}
