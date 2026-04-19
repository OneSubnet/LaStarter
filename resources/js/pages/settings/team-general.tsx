import { Head, usePage } from '@inertiajs/react';
import { useForm as useTanStackForm } from '@tanstack/react-form';
import { useState } from 'react';
import DeleteTeamModal from '@/components/delete-team-modal';
import Guard from '@/components/guard';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TeamSettingsLayout from '@/layouts/team-settings-layout';
import { inertiaSubmit, zodValidator } from '@/lib/inertia-form';
import { teamGeneralSchema } from '@/lib/schemas';
import {
    general as generalUrl,
    update as updateUrl,
} from '@/routes/settings/team';

type Props = {
    team: {
        id: number;
        name: string;
        slug: string;
        isPersonal: boolean;
    };
    permissions: string[];
};

export default function TeamGeneral({ team, permissions }: Props) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [serverErrors, setServerErrors] = useState<Record<string, string>>(
        {},
    );

    const can = (permission: string) => permissions.includes(permission);
    const canUpdate = can('team.update');
    const canDelete = can('team.delete');

    const form = useTanStackForm({
        defaultValues: { name: team.name },
        validators: { onChange: zodValidator(teamGeneralSchema) },
        onSubmit: ({ value }) => {
            setServerErrors({});
            inertiaSubmit({
                url: updateUrl(team.slug).url,
                method: 'patch',
                onSuccess: () => setServerErrors({}),
                onError: (errors) => setServerErrors(errors),
            })(value as Record<string, string>);
        },
    });

    return (
        <TeamSettingsLayout
            activeTab="General"
            breadcrumbs={[
                {
                    title: team.name,
                    href: generalUrl(team.slug).url,
                },
            ]}
        >
            <Head title={`General - ${team.name}`} />
            <h1 className="sr-only">Team settings</h1>

            <div className="flex flex-col space-y-10">
                <div className="space-y-6">
                    {canUpdate ? (
                        <>
                            <Heading
                                variant="small"
                                title="Team settings"
                                description="Update your team name and settings"
                            />

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    form.handleSubmit();
                                }}
                                className="space-y-6"
                            >
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Team name</Label>
                                    <form.Field name="name">
                                        {(field) => (
                                            <>
                                                <Input
                                                    id="name"
                                                    data-test="team-name-input"
                                                    value={field.state.value}
                                                    onChange={(e) =>
                                                        field.handleChange(
                                                            e.target.value,
                                                        )
                                                    }
                                                    onBlur={field.handleBlur}
                                                    disabled={team.isPersonal}
                                                />
                                                <InputError
                                                    message={
                                                        (field.state.meta
                                                            .errors?.[0] as
                                                            | string
                                                            | undefined) ??
                                                        serverErrors.name
                                                    }
                                                />
                                            </>
                                        )}
                                    </form.Field>
                                </div>

                                {!team.isPersonal && (
                                    <form.Subscribe
                                        selector={(state) => [
                                            state.canSubmit,
                                            state.isSubmitting,
                                        ]}
                                    >
                                        {([canSubmit, isSubmitting]) => (
                                            <div className="flex items-center gap-4">
                                                <Button
                                                    type="submit"
                                                    data-test="team-save-button"
                                                    disabled={
                                                        !canSubmit ||
                                                        isSubmitting
                                                    }
                                                >
                                                    {isSubmitting
                                                        ? 'Saving...'
                                                        : 'Save'}
                                                </Button>
                                            </div>
                                        )}
                                    </form.Subscribe>
                                )}
                            </form>
                        </>
                    ) : (
                        <>
                            <Heading variant="small" title={team.name} />
                            <div className="grid gap-2">
                                <Label>Team name</Label>
                                <p className="text-sm text-muted-foreground">
                                    {team.name}
                                </p>
                            </div>
                        </>
                    )}
                </div>

                <Guard permission="team.delete">
                    {!team.isPersonal && canDelete ? (
                        <div className="space-y-6">
                            <Heading
                                variant="small"
                                title="Delete team"
                                description="Permanently delete your team"
                            />
                            <div className="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10">
                                <div className="relative space-y-0.5 text-red-600 dark:text-red-100">
                                    <p className="font-medium">Warning</p>
                                    <p className="text-sm">
                                        Please proceed with caution, this cannot
                                        be undone.
                                    </p>
                                </div>
                                <Button
                                    variant="destructive"
                                    data-test="delete-team-button"
                                    onClick={() => setDeleteDialogOpen(true)}
                                >
                                    Delete team
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </Guard>
            </div>

            <Guard permission="team.delete">
                {!team.isPersonal ? (
                    <DeleteTeamModal
                        team={team}
                        open={deleteDialogOpen}
                        onOpenChange={setDeleteDialogOpen}
                    />
                ) : null}
            </Guard>
        </TeamSettingsLayout>
    );
}
