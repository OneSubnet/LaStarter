import { Head, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    const { t } = useTranslation();
    return (
        <AuthLayout
            title={t('auth.verify_email.title')}
            description={t('auth.verify_email.description')}
        >
            <Head title={t('auth.verify_email.head_title')} />

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-center text-sm font-medium text-primary">
                    {t('auth.verify_email.verification_sent')}
                </div>
            )}

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    router.post(send().url);
                }}
                className="space-y-6 text-center"
            >
                <Button type="submit" variant="secondary">
                    <Spinner />
                    {t('auth.verify_email.resend')}
                </Button>

                <TextLink
                    href={logout()}
                    className="mx-auto block text-sm"
                >
                    {t('auth.verify_email.logout')}
                </TextLink>
            </form>
        </AuthLayout>
    );
}
