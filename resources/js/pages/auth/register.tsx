import { Head, router } from '@inertiajs/react';
import { useForm } from '@tanstack/react-form';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { zodValidator } from '@/lib/inertia-form';
import { registerSchema } from '@/lib/schemas';
import { login } from '@/routes';
import { store } from '@/routes/register';

export default function Register() {
    const form = useForm({
        defaultValues: {
            name: '',
            email: '',
            password: '',
            password_confirmation: '',
        },
        validators: { onChange: zodValidator(registerSchema) },
        onSubmit: ({ value }) => {
            router.post(store().url, value, {
                preserveScroll: true,
            });
        },
    });

    return (
        <AuthLayout
            title="Create an account"
            description="Enter your details below to create your account"
        >
            <Head title="Register" />

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    form.handleSubmit();
                }}
                className="flex flex-col gap-6"
            >
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <form.Field name="name">
                            {(field) => (
                                <>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        onBlur={field.handleBlur}
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="name"
                                        placeholder="Full name"
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
                        <Label htmlFor="email">Email address</Label>
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
                                        tabIndex={2}
                                        autoComplete="email"
                                        placeholder="email@example.com"
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
                                        tabIndex={3}
                                        autoComplete="new-password"
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
                                        tabIndex={4}
                                        autoComplete="new-password"
                                        placeholder="Confirm password"
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
                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={5}
                                disabled={!canSubmit || isSubmitting}
                                data-test="register-user-button"
                            >
                                {isSubmitting && <Spinner />}
                                Create account
                            </Button>
                        )}
                    </form.Subscribe>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <TextLink href={login()} tabIndex={6}>
                        Log in
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
