import { Head, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Briefcase, Check, Globe, Rocket, User, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
    user: {
        name: string;
        email: string;
        onboarding_step: number;
    };
    team: {
        name: string;
        slug: string;
        icon_url: string | null;
    } | null;
};

const stepVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
};

const TOTAL_STEPS = 4;

export default function OnboardingIndex({ user, team }: Props) {
    const { t, i18n } = useTranslation();
    const [step, setStep] = useState(Math.min(user.onboarding_step, TOTAL_STEPS - 1));

    const [name, setName] = useState(user.name);
    const [teamName, setTeamName] = useState(team?.name ?? '');
    const [emails, setEmails] = useState<string[]>(['']);
    const [selectedRole, setSelectedRole] = useState('');

    const goNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
    const goPrev = () => setStep((s) => Math.max(s - 1, 0));

    const saveStep = (stepIndex: number, data: Record<string, unknown>, onSuccess?: () => void) => {
        router.post(
            `/${team?.slug ?? ''}/onboarding`,
            { step: stepIndex, ...data },
            {
                preserveScroll: true,
                onSuccess: onSuccess ?? goNext,
                onError: (errors) => console.error(errors),
            },
        );
    };

    const handleStepSubmit = () => {
        switch (step) {
            case 0:
                saveStep(0, { name });
                break;
            case 1:
                saveStep(1, { team_name: teamName });
                break;
            case 2:
                saveStep(2, { emails: emails.filter(Boolean) });
                break;
            case 3:
                if (selectedRole) {
                    saveStep(3, { role: selectedRole });
                }
                break;
        }
    };

    const skipStep = () => {
        saveStep(step, {});
    };

    const roleOptions = [
        { id: 'freelance', icon: User, label: t('onboarding.roles.freelance'), desc: t('onboarding.roles.freelance_desc') },
        { id: 'agency', icon: Briefcase, label: t('onboarding.roles.agency'), desc: t('onboarding.roles.agency_desc') },
        { id: 'team_lead', icon: Users, label: t('onboarding.roles.team_lead'), desc: t('onboarding.roles.team_lead_desc') },
    ];

    return (
        <div className="flex min-h-svh flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            <Head title={t('onboarding.head_title')} />

            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-4">
                <button
                    onClick={() => (step > 0 ? goPrev() : router.visit(`/${team?.slug ?? ''}/dashboard`))}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {step > 0 ? t('onboarding.previous') : t('onboarding.exit')}
                </button>

                <select
                    value={i18n.language}
                    onChange={(e) => i18n.changeLanguage(e.target.value)}
                    className="rounded-md border bg-background px-2 py-1 text-xs"
                >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                </select>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col items-center justify-center px-6">
                <div className="w-full max-w-md">
                    {/* Step indicator */}
                    <div className="mb-10 flex items-center justify-center gap-2">
                        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                            <div key={i} className="flex items-center">
                                <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                                        i < step
                                            ? 'bg-primary text-primary-foreground'
                                            : i === step
                                              ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                                              : 'bg-muted text-muted-foreground'
                                    }`}
                                >
                                    {i < step ? <Check className="h-4 w-4" /> : i + 1}
                                </div>
                                {i < TOTAL_STEPS - 1 && (
                                    <div className={`h-0.5 w-8 ${i < step ? 'bg-primary' : 'bg-muted'}`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Step content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            variants={stepVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                        >
                            {step === 0 && (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <User className="mx-auto mb-3 h-10 w-10 text-primary" />
                                        <h2 className="text-xl font-semibold">{t('onboarding.profile_title')}</h2>
                                        <p className="mt-1 text-sm text-muted-foreground">{t('onboarding.profile_desc')}</p>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">{t('onboarding.name_label')}</Label>
                                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {step === 1 && (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <Rocket className="mx-auto mb-3 h-10 w-10 text-primary" />
                                        <h2 className="text-xl font-semibold">{t('onboarding.workspace_title')}</h2>
                                        <p className="mt-1 text-sm text-muted-foreground">{t('onboarding.workspace_desc')}</p>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="team_name">{t('onboarding.team_name_label')}</Label>
                                        <Input id="team_name" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <Users className="mx-auto mb-3 h-10 w-10 text-primary" />
                                        <h2 className="text-xl font-semibold">{t('onboarding.connections_title')}</h2>
                                        <p className="mt-1 text-sm text-muted-foreground">{t('onboarding.connections_desc')}</p>
                                    </div>
                                    <div className="space-y-3">
                                        {emails.map((email, i) => (
                                            <Input
                                                key={i}
                                                type="email"
                                                placeholder={t('onboarding.email_placeholder')}
                                                value={email}
                                                onChange={(e) => {
                                                    const updated = [...emails];
                                                    updated[i] = e.target.value;
                                                    setEmails(updated);
                                                }}
                                            />
                                        ))}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setEmails([...emails, ''])}
                                        >
                                            + {t('onboarding.add_email')}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <Globe className="mx-auto mb-3 h-10 w-10 text-primary" />
                                        <h2 className="text-xl font-semibold">{t('onboarding.role_title')}</h2>
                                        <p className="mt-1 text-sm text-muted-foreground">{t('onboarding.role_desc')}</p>
                                    </div>
                                    <div className="space-y-3">
                                        {roleOptions.map((opt) => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => setSelectedRole(opt.id)}
                                                className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                                                    selectedRole === opt.id
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-border hover:border-primary/50'
                                                }`}
                                            >
                                                <opt.icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                                                <div>
                                                    <div className="font-medium">{opt.label}</div>
                                                    <div className="text-sm text-muted-foreground">{opt.desc}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between px-6 py-4">
                <div />
                <div className="flex items-center gap-3">
                    {step < 3 && (
                        <Button type="button" variant="ghost" onClick={skipStep}>
                            {t('onboarding.skip')}
                        </Button>
                    )}
                    <Button type="button" onClick={handleStepSubmit}>
                        {step < TOTAL_STEPS - 1
                            ? t('onboarding.next')
                            : t('onboarding.get_started')}
                        {step < TOTAL_STEPS - 1 && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
