import { Head, router } from '@inertiajs/react';
import { useForm } from '@tanstack/react-form';
import { LoaderCircle } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { zodValidator } from '@/lib/inertia-form';
import { forgotPasswordSchema } from '@/lib/schemas';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    const form = useForm({
        defaultValues: { email: '' },
        validators: { onChange: zodValidator(forgotPasswordSchema) },
        onSubmit: ({ value }) => {
            router.post(email().url, value, { preserveScroll: true });
        },
    });

    return (
        <AuthLayout
            title="Forgot password"
            description="Enter your email to receive a password reset link"
        >
            <Head title="Forgot password" />

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <div className="space-y-6">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit();
                    }}
                >
                    <form.Field name="email">
                        {(field) => (
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={field.state.value}
                                    onChange={(e) =>
                                        field.handleChange(e.target.value)
                                    }
                                    onBlur={field.handleBlur}
                                    autoComplete="off"
                                    autoFocus
                                    placeholder="email@example.com"
                                />
                                <InputError
                                    message={
                                        field.state.meta.errors?.[0] as
                                            | string
                                            | undefined
                                    }
                                />
                            </div>
                        )}
                    </form.Field>

                    <form.Subscribe
                        selector={(state) => [state.canSubmit, state.isSubmitting]}
                    >
                        {([canSubmit, isSubmitting]) => (
                            <div className="my-6 flex items-center justify-start">
                                <Button
                                    className="w-full"
                                    disabled={!canSubmit || isSubmitting}
                                    data-test="email-password-reset-link-button"
                                >
                                    {isSubmitting && (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                    )}
                                    Email password reset link
                                </Button>
                            </div>
                        )}
                    </form.Subscribe>
                </form>

                <div className="space-x-1 text-center text-sm text-muted-foreground">
                    <span>Or, return to</span>
                    <TextLink href={login()}>log in</TextLink>
                </div>
            </div>
        </AuthLayout>
    );
}
