import { Head, router } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { OTP_MAX_LENGTH } from '@/hooks/use-two-factor-auth';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/routes/two-factor/login';

export default function TwoFactorChallenge() {
    const [showRecoveryInput, setShowRecoveryInput] = useState<boolean>(false);
    const [code, setCode] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const authConfigContent = useMemo<{
        title: string;
        description: string;
        toggleText: string;
    }>(() => {
        if (showRecoveryInput) {
            return {
                title: 'Recovery code',
                description:
                    'Please confirm access to your account by entering one of your emergency recovery codes.',
                toggleText: 'login using an authentication code',
            };
        }

        return {
            title: 'Authentication code',
            description:
                'Enter the authentication code provided by your authenticator application.',
            toggleText: 'login using a recovery code',
        };
    }, [showRecoveryInput]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        const data = showRecoveryInput ? { recovery_code: code } : { code };
        router.post(store().url, data, {
            onError: (errs) => setErrors(errs),
        });
    };

    const toggleRecoveryMode = () => {
        setShowRecoveryInput(!showRecoveryInput);
        setErrors({});
        setCode('');
    };

    return (
        <AuthLayout
            title={authConfigContent.title}
            description={authConfigContent.description}
        >
            <Head title="Two-factor authentication" />

            <div className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {showRecoveryInput ? (
                        <>
                            <Input
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                type="text"
                                placeholder="Enter recovery code"
                                autoFocus={showRecoveryInput}
                                required
                            />
                            <InputError message={errors.recovery_code} />
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center space-y-3 text-center">
                            <div className="flex w-full items-center justify-center">
                                <InputOTP
                                    maxLength={OTP_MAX_LENGTH}
                                    value={code}
                                    onChange={(value) => setCode(value)}
                                    pattern={REGEXP_ONLY_DIGITS}
                                >
                                    <InputOTPGroup>
                                        {Array.from(
                                            { length: OTP_MAX_LENGTH },
                                            (_, index) => (
                                                <InputOTPSlot
                                                    key={index}
                                                    index={index}
                                                />
                                            ),
                                        )}
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>
                            <InputError message={errors.code} />
                        </div>
                    )}

                    <Button type="submit" className="w-full">
                        Continue
                    </Button>

                    <div className="text-center text-sm text-muted-foreground">
                        <span>or you can </span>
                        <button
                            type="button"
                            className="cursor-pointer text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                            onClick={toggleRecoveryMode}
                        >
                            {authConfigContent.toggleText}
                        </button>
                    </div>
                </form>
            </div>
        </AuthLayout>
    );
}
