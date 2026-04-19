import { Head, Link, usePage } from '@inertiajs/react';
import { useForm as useTanStackForm } from '@tanstack/react-form';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AccountLayout from '@/layouts/account-layout';
import { inertiaSubmit, zodValidator } from '@/lib/inertia-form';
import { profileSchema } from '@/lib/schemas';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage().props;

    const form = useTanStackForm({
        defaultValues: {
            name: auth.user.name as string,
            email: auth.user.email as string,
        },
        validators: { onChange: zodValidator(profileSchema) },
        onSubmit: ({ value }) => {
            inertiaSubmit({
                url: ProfileController.update.url(),
                method: 'patch',
                preserveScroll: true,
            })(value as Record<string, string>);
        },
    });

    return (
        <AccountLayout
            breadcrumbs={[
                { title: 'Profile settings', href: edit().url },
            ]}
        >
            <Head title="Profile settings" />
            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile information"
                    description="Update your name and email address"
                />

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit();
                    }}
                    className="space-y-6"
                >
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <form.Field name="name">
                            {(field) => (
                                <>
                                    <Input
                                        id="name"
                                        className="mt-1 block w-full"
                                        value={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        onBlur={field.handleBlur}
                                        autoComplete="name"
                                        placeholder="Full name"
                                    />
                                    <InputError
                                        className="mt-2"
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
                        <Label htmlFor="email">Email address</Label>
                        <form.Field name="email">
                            {(field) => (
                                <>
                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        value={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        onBlur={field.handleBlur}
                                        autoComplete="username"
                                        placeholder="Email address"
                                    />
                                    <InputError
                                        className="mt-2"
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

                    {mustVerifyEmail &&
                        auth.user.email_verified_at === null && (
                            <div>
                                <p className="-mt-4 text-sm text-muted-foreground">
                                    Your email address is unverified.{' '}
                                    <Link
                                        href={send()}
                                        as="button"
                                        className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                    >
                                        Click here to resend the verification
                                        email.
                                    </Link>
                                </p>
                                {status === 'verification-link-sent' && (
                                    <div className="mt-2 text-sm font-medium text-green-600">
                                        A new verification link has been sent to
                                        your email address.
                                    </div>
                                )}
                            </div>
                        )}

                    <form.Subscribe
                        selector={(state) => [state.canSubmit, state.isSubmitting]}
                    >
                        {([canSubmit, isSubmitting]) => (
                            <div className="flex items-center gap-4">
                                <Button
                                    type="submit"
                                    disabled={!canSubmit || isSubmitting}
                                    data-test="update-profile-button"
                                >
                                    {isSubmitting ? 'Saving...' : 'Save'}
                                </Button>
                            </div>
                        )}
                    </form.Subscribe>
                </form>
            </div>

            <DeleteUser />
        </AccountLayout>
    );
}
