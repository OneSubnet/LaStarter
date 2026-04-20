import { Head, router } from '@inertiajs/react';
import { useForm } from '@tanstack/react-form';
import { ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import AccountLayout from '@/layouts/account-layout';
import { zodValidator } from '@/lib/inertia-form';
import { securitySchema } from '@/lib/schemas';
import { edit } from '@/routes/security';
import { disable, enable } from '@/routes/two-factor';

type Props = {
    canManageTwoFactor?: boolean;
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
};

export default function Security({
    canManageTwoFactor = false,
    requiresConfirmation = false,
    twoFactorEnabled = false,
}: Props) {
    const { t } = useTranslation();
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    const {
        qrCodeSvg,
        hasSetupData,
        manualSetupKey,
        clearSetupData,
        clearTwoFactorAuthData,
        fetchSetupData,
        recoveryCodesList,
        fetchRecoveryCodes,
        errors: twoFactorErrors,
    } = useTwoFactorAuth();
    const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
    const prevTwoFactorEnabled = useRef(twoFactorEnabled);

    useEffect(() => {
        if (prevTwoFactorEnabled.current && !twoFactorEnabled) {
            clearTwoFactorAuthData();
        }

        prevTwoFactorEnabled.current = twoFactorEnabled;
    }, [twoFactorEnabled, clearTwoFactorAuthData]);

    const form = useForm({
        defaultValues: {
            current_password: '',
            password: '',
            password_confirmation: '',
        },
        validators: { onChange: zodValidator(securitySchema) },
        onSubmit: ({ value, formApi }) => {
            router.patch(SecurityController.update.url(), value, {
                preserveScroll: true,
                onSuccess: () => formApi.reset(),
                onError: (errors) => {
                    if (errors.password) {
currentPasswordInput.current?.focus();
}

                    if (errors.current_password) {
currentPasswordInput.current?.focus();
}
                },
            });
        },
    });

    return (
        <AccountLayout
            breadcrumbs={[
                { title: t('settings.security.title'), href: edit().url },
            ]}
        >
            <Head title={t('settings.security.title')} />
            <h1 className="sr-only">{t('settings.security.title')}</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title={t('settings.security.password_title')}
                    description={t('settings.security.password_description')}
                />

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit();
                    }}
                    className="space-y-6"
                >
                    <div className="grid gap-2">
                        <Label htmlFor="current_password">{t('settings.security.current_password_label')}</Label>
                        <form.Field name="current_password">
                            {(field) => (
                                <>
                                    <PasswordInput
                                        id="current_password"
                                        ref={currentPasswordInput}
                                        value={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        onBlur={field.handleBlur}
                                        className="mt-1 block w-full"
                                        autoComplete="current-password"
                                        placeholder={t('settings.security.current_password_placeholder')}
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
                        <Label htmlFor="password">{t('settings.security.new_password_label')}</Label>
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
                                        className="mt-1 block w-full"
                                        autoComplete="new-password"
                                        placeholder={t('settings.security.new_password_placeholder')}
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
                        <Label htmlFor="password_confirmation">
                            {t('settings.security.confirm_password_label')}
                        </Label>
                        <form.Field name="password_confirmation">
                            {(field) => (
                                <>
                                    <PasswordInput
                                        id="password_confirmation"
                                        value={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        onBlur={field.handleBlur}
                                        className="mt-1 block w-full"
                                        autoComplete="new-password"
                                        placeholder={t('settings.security.confirm_password_placeholder')}
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
                    <form.Subscribe
                        selector={(state) => [state.canSubmit, state.isSubmitting]}
                    >
                        {([canSubmit, isSubmitting]) => (
                            <div className="flex items-center gap-4">
                                <Button
                                    type="submit"
                                    disabled={!canSubmit || isSubmitting}
                                    data-test="update-password-button"
                                >
                                    {isSubmitting ? t('settings.security.saving') : t('settings.security.save')}
                                </Button>
                            </div>
                        )}
                    </form.Subscribe>
                </form>
            </div>

            {canManageTwoFactor && (
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title={t('settings.security.two_factor_title')}
                        description={t('settings.security.two_factor_description')}
                    />
                    {twoFactorEnabled ? (
                        <div className="flex flex-col items-start justify-start space-y-4">
                            <p className="text-sm text-muted-foreground">
                                {t('settings.security.two_factor_enabled')}
                            </p>
                            <div className="relative inline">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        router.delete(disable().url);
                                    }}
                                >
                                    <Button variant="destructive" type="submit">
                                        {t('settings.security.disable_2fa')}
                                    </Button>
                                </form>
                            </div>
                            <TwoFactorRecoveryCodes
                                recoveryCodesList={recoveryCodesList}
                                fetchRecoveryCodes={fetchRecoveryCodes}
                                errors={twoFactorErrors}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-start justify-start space-y-4">
                            <p className="text-sm text-muted-foreground">
                                {t('settings.security.two_factor_disabled')}
                            </p>
                            <div>
                                {hasSetupData ? (
                                    <Button
                                        onClick={() => setShowSetupModal(true)}
                                    >
                                        <ShieldCheck />
                                        {t('settings.security.continue_setup')}
                                    </Button>
                                ) : (
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            router.post(
                                                enable().url,
                                                {},
                                                {
                                                    onSuccess: () =>
                                                        setShowSetupModal(true),
                                                },
                                            );
                                        }}
                                    >
                                        <Button type="submit">{t('settings.security.enable_2fa')}</Button>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}

                    <TwoFactorSetupModal
                        isOpen={showSetupModal}
                        onClose={() => setShowSetupModal(false)}
                        requiresConfirmation={requiresConfirmation}
                        twoFactorEnabled={twoFactorEnabled}
                        qrCodeSvg={qrCodeSvg}
                        manualSetupKey={manualSetupKey}
                        clearSetupData={clearSetupData}
                        fetchSetupData={fetchSetupData}
                        errors={twoFactorErrors}
                    />
                </div>
            )}
        </AccountLayout>
    );
}
