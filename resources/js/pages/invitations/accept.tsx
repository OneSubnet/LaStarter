import { Head, router, usePage } from '@inertiajs/react';
import { useForm } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import AppLogoIcon from '@/components/app-logo-icon';
import { z } from 'zod';

type FooterLink = { title: string; href: string };

type Props = {
    invitation: {
        code: string;
        email: string;
        role: string;
    };
    team: {
        name: string;
        icon_url: string | null;
    };
    inviter: {
        name: string;
    } | null;
};

const inviteRegisterSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    email: z.string().email('Invalid email address').max(255),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

export default function Accept({ invitation, team, inviter }: Props) {
    const { t } = useTranslation();
    const footerLinks = (usePage().props.footerLinks as FooterLink[] | undefined) ?? [];

    const form = useForm({
        defaultValues: {
            name: '',
            email: invitation.email,
            password: '',
        },
        validators: { onChange: inviteRegisterSchema },
        onSubmit: ({ value }) => {
            router.post(`/invitations/${invitation.code}/register`, value, {
                preserveScroll: true,
            });
        },
    });

    return (
        <section className="container flex min-h-svh items-center py-16">
            <div className="flex w-full flex-col gap-16 sm:items-center">
                {/* Team logo */}
                <div className="flex items-center justify-center">
                    {team.icon_url ? (
                        <img src={team.icon_url} alt={team.name} className="h-12 w-auto dark:invert" />
                    ) : (
                        <div className="flex h-12 items-center gap-2 text-xl font-bold">
                            <AppLogoIcon className="h-10 w-8 fill-current text-[var(--foreground)] dark:text-white" />
                            <span>{team.name}</span>
                        </div>
                    )}
                </div>

                {/* Main card */}
                <div className="flex w-full max-w-3xl flex-col-reverse items-start gap-10 sm:rounded-2xl sm:border sm:px-10 sm:pt-10 sm:pb-10 md:flex-row md:pt-16 lg:gap-20 lg:rounded-3xl lg:px-20 lg:pt-24">
                    {/* Form side */}
                    <div className="flex w-full flex-col gap-6 sm:max-w-sm md:justify-between">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.handleSubmit();
                            }}
                            className="flex flex-col gap-4"
                        >
                            <form.Field name="name">
                                {(field) => (
                                    <div>
                                        <Input
                                            type="text"
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            onBlur={field.handleBlur}
                                            autoFocus
                                            autoComplete="name"
                                            placeholder={t('invitations.name_placeholder')}
                                            className="h-14 rounded-full border-none bg-muted px-5 py-4 font-medium"
                                        />
                                        <InputError message={field.state.meta.errors?.[0] as string | undefined} />
                                    </div>
                                )}
                            </form.Field>

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
                                            placeholder={t('invitations.email_label')}
                                            className="h-14 rounded-full border-none bg-muted px-5 py-4 font-medium opacity-60"
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
                                            placeholder={t('invitations.password_placeholder')}
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
                                        disabled={!canSubmit || isSubmitting}
                                    >
                                        {isSubmitting && <Spinner />}
                                        {t('invitations.submit')}
                                    </Button>
                                )}
                            </form.Subscribe>
                        </form>

                        <p className="text-xs text-muted-foreground">
                            {t('invitations.disclaimer')}
                        </p>
                    </div>

                    {/* Info side */}
                    <div className="flex w-full flex-col gap-4 sm:max-w-sm">
                        <h3 className="text-2xl font-bold">
                            {t('invitations.heading', { team: team.name })}
                        </h3>
                        <div className="space-y-4 text-sm font-medium text-muted-foreground">
                            {inviter && (
                                <p>{t('invitations.description_inviter', { name: inviter.name, team: team.name })}</p>
                            )}
                            <p>{t('invitations.description', { team: team.name })}</p>
                        </div>
                    </div>
                </div>

                {/* Footer links */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} {team.name}</p>
                    {footerLinks.map((link) => (
                        <a key={link.href} href={link.href} className="underline" target="_blank" rel="noopener noreferrer">
                            {link.title}
                        </a>
                    ))}
                </div>
            </div>

            <Head title={t('invitations.heading', { team: team.name })} />
        </section>
    );
}
