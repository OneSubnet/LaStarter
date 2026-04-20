import { Head, router } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Verify email"
            description="Please verify your email address by clicking on the link we just emailed to you."
        >
            <Head title="Email verification" />

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-center text-sm font-medium text-primary">
                    A new verification link has been sent to the email address
                    you provided during registration.
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
                    Resend verification email
                </Button>

                <TextLink
                    href={logout()}
                    className="mx-auto block text-sm"
                >
                    Log out
                </TextLink>
            </form>
        </AuthLayout>
    );
}
