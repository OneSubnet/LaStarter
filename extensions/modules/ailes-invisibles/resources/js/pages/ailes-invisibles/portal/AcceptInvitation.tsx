import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import LanguageSelector from '@/components/language-selector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PasswordInput from '@/components/password-input';
import { Spinner } from '@/components/ui/spinner';

type FooterLink = { title: string; href: string };

type Props = {
    clientEmail: string;
    teamName: string;
    teamIcon: string | null;
    token: string;
    footerLinks: FooterLink[];
};

export default function AcceptInvitation({ clientEmail, teamName, teamIcon, token, footerLinks }: Props) {
    const { t } = useTranslation();
    const [step, setStep] = useState<1 | 2>(1);

    const form = useForm({
        password: '',
        password_confirmation: '',
    });

    const handleNext = (e: FormEvent) => {
        e.preventDefault();
        setStep(2);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        form.post(`/portal/accept/${token}`);
    };

    return (
        <section className="container flex min-h-svh items-center py-16">
            <div className="flex w-full flex-col gap-12 sm:items-center">
                {/* Team logo */}
                <div className="flex items-center justify-center">
                    {teamIcon ? (
                        <img src={teamIcon} alt={teamName} className="h-12 w-auto dark:invert" />
                    ) : (
                        <div className="flex h-12 items-center gap-2 text-xl font-bold">
                            <AppLogoIcon className="h-10 w-8 fill-current text-[var(--foreground)] dark:text-white" />
                            <span>{teamName}</span>
                        </div>
                    )}
                </div>

                {/* Title */}
                <h1 className="w-full text-center text-2xl font-medium tracking-tight">
                    {t('ai.portal.accept.title')}
                </h1>

                {/* Step 1: Welcome */}
                {step === 1 && (
                    <form onSubmit={handleNext} className="flex w-full max-w-sm flex-col gap-4">
                        <p className="text-center text-sm text-muted-foreground">
                            {t('ai.portal.accept.step1_description')}
                        </p>
                        <div>
                            <Input
                                type="email"
                                value={clientEmail}
                                readOnly
                                className="h-14 rounded-full border-none bg-muted px-5 py-4 font-medium opacity-60"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="h-14 w-full rounded-full bg-foreground font-medium tracking-tight text-background hover:bg-foreground/90"
                        >
                            {t('ai.portal.accept.next')}
                        </Button>
                    </form>
                )}

                {/* Step 2: Set password */}
                {step === 2 && (
                    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
                        <p className="text-center text-sm text-muted-foreground">
                            {t('ai.portal.accept.set_password')}
                        </p>
                        <div>
                            <PasswordInput
                                value={form.data.password}
                                onChange={(e) => form.setData('password', e.target.value)}
                                autoFocus
                                autoComplete="new-password"
                                placeholder={t('ai.portal.accept.password_placeholder')}
                                className="h-14 rounded-full border-none bg-muted px-5 py-4 font-medium"
                            />
                            <InputError message={form.errors.password} />
                        </div>
                        <div>
                            <PasswordInput
                                value={form.data.password_confirmation}
                                onChange={(e) => form.setData('password_confirmation', e.target.value)}
                                autoComplete="new-password"
                                placeholder={t('ai.portal.accept.password_confirm_placeholder')}
                                className="h-14 rounded-full border-none bg-muted px-5 py-4 font-medium"
                            />
                            <InputError message={form.errors.password_confirmation} />
                        </div>
                        <Button
                            type="submit"
                            className="h-14 w-full rounded-full bg-foreground font-medium tracking-tight text-background hover:bg-foreground/90"
                            disabled={form.processing}
                        >
                            {form.processing && <Spinner />}
                            {t('ai.portal.accept.submit')}
                        </Button>
                    </form>
                )}

                {/* Footer */}
                <div className="flex w-full max-w-lg items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                        <p>&copy; {new Date().getFullYear()} {teamName}</p>
                        {footerLinks.map((link) => (
                            <a key={link.href} href={link.href} className="underline" target="_blank" rel="noopener noreferrer">
                                {link.title}
                            </a>
                        ))}
                    </div>
                    <LanguageSelector />
                </div>
            </div>

            <Head title={t('ai.portal.accept.title')} />
        </section>
    );
}
