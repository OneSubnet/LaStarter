import { Head, router } from '@inertiajs/react';
import { useForm } from '@tanstack/react-form';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { zodValidator } from '@/lib/inertia-form';
import { resetPasswordSchema } from '@/lib/schemas';
import { update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
};

export default function ResetPassword({ token, email }: Props) {
    const form = useForm({
        defaultValues: {
            email,
            password: '',
            password_confirmation: '',
        },
        validators: { onChange: zodValidator(resetPasswordSchema) },
        onSubmit: ({ value }) => {
            router.post(update().url, { ...value, token, email }, {
                preserveScroll: true,
            });
        },
    });

    return (
        <AuthLayout
            title="Reset password"
            description="Please enter your new password below"
        >
            <Head title="Reset password" />

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    form.handleSubmit();
                }}
            >
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <form.Field name="email">
                            {(field) => (
                                <>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        onBlur={field.handleBlur}
                                        autoComplete="email"
                                        className="mt-1 block w-full"
                                        readOnly
                                    />
                                    <InputError
                                        message={
                                            field.state.meta.errors?.[0] as
                                                | string
                                                | undefined
                                        }
                                        className="mt-2"
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
                                    <PasswordInput
                                        id="password"
                                        value={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        onBlur={field.handleBlur}
                                        autoComplete="new-password"
                                        className="mt-1 block w-full"
                                        autoFocus
                                        placeholder="Password"
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
                            Confirm password
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
                                        autoComplete="new-password"
                                        className="mt-1 block w-full"
                                        placeholder="Confirm password"
                                    />
                                    <InputError
                                        message={
                                            field.state.meta.errors?.[0] as
                                                | string
                                                | undefined
                                        }
                                        className="mt-2"
                                    />
                                </>
                            )}
                        </form.Field>
                    </div>

                    <form.Subscribe
                        selector={(state) => [state.canSubmit, state.isSubmitting]}
                    >
                        {([canSubmit, isSubmitting]) => (
                            <Button
                                type="submit"
                                className="mt-4 w-full"
                                disabled={!canSubmit || isSubmitting}
                                data-test="reset-password-button"
                            >
                                {isSubmitting && <Spinner />}
                                Reset password
                            </Button>
                        )}
                    </form.Subscribe>
                </div>
            </form>
        </AuthLayout>
    );
}
