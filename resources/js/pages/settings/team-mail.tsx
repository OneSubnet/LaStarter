import { Head, router, usePage } from '@inertiajs/react';
import { useForm } from '@tanstack/react-form';
import { Mail } from 'lucide-react';
import { useState } from 'react';
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
                { title: 'Mail', href: mailUrl(teamSlug).url },
            ]}
        >
            <Head title="Mail Settings" />
            <h1 className="sr-only">Mail Settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Mail server"
                    description="Configure the SMTP server for outgoing emails from this team"
                />

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit();
                    }}
                    className="space-y-6"
                >
                    <div className="grid gap-2">
                        <Label htmlFor="host">Host</Label>
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
                                        placeholder="smtp.example.com"
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
                            <Label htmlFor="port">Port</Label>
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
                                            placeholder="587"
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
                            <Label htmlFor="encryption">Encryption</Label>
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
                                                    TLS
                                                </SelectItem>
                                                <SelectItem value="ssl">
                                                    SSL
                                                </SelectItem>
                                                <SelectItem value="none">
                                                    None
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
                            <Label htmlFor="username">Username</Label>
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
                                            placeholder="smtp username"
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
                            <Label htmlFor="password">Password</Label>
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
                                            placeholder="••••••••"
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
                            <Label htmlFor="from_address">From address</Label>
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
                                            placeholder="noreply@example.com"
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
                            <Label htmlFor="from_name">From name</Label>
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
                                            placeholder="My Team"
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
                                    {isSubmitting ? 'Saving...' : 'Save'}
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
                            {sendingTest ? 'Sending...' : 'Send test email'}
                        </Button>
                    </div>
                </form>
            </div>
        </TeamSettingsLayout>
    );
}
