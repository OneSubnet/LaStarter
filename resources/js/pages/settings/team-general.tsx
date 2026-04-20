import { Head, router } from '@inertiajs/react';
import { useForm as useTanStackForm } from '@tanstack/react-form';
import { Camera, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import DeleteTeamModal from '@/components/delete-team-modal';
import Guard from '@/components/guard';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TeamSettingsLayout from '@/layouts/team-settings-layout';
import { inertiaSubmit, zodValidator } from '@/lib/inertia-form';
import { teamGeneralSchema } from '@/lib/schemas';
import {
    general as generalUrl,
    update as updateUrl,
    icon as iconUrl,
} from '@/routes/settings/team';
import { remove as iconRemoveUrl } from '@/routes/settings/team/icon';

type Props = {
    team: {
        id: number;
        name: string;
        slug: string;
        isPersonal: boolean;
        icon_url: string | null;
    };
    permissions: string[];
};

export default function TeamGeneral({ team, permissions }: Props) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [serverErrors, setServerErrors] = useState<Record<string, string>>(
        {},
    );
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

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

    const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) {
return;
}

        setUploading(true);
        const formData = new FormData();
        formData.append('icon', file);

        router.post(iconUrl(team.slug).url, formData, {
            preserveScroll: true,
            onFinish: () => {
                setUploading(false);

                if (fileInputRef.current) {
fileInputRef.current.value = '';
}
            },
        });
    };

    const handleIconRemove = () => {
        router.delete(iconRemoveUrl(team.slug).url, {
            preserveScroll: true,
        });
    };

    const initials = team.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

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
                                description="Update your team name and icon"
                            />

                            {/* Team icon */}
                            <div className="flex items-center gap-4">
                                <Avatar className="size-16">
                                    <AvatarImage
                                        src={team.icon_url ?? undefined}
                                        alt={team.name}
                                    />
                                    <AvatarFallback className="text-lg">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex items-center gap-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp,.svg"
                                        className="hidden"
                                        onChange={handleIconUpload}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={uploading}
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                    >
                                        <Camera className="mr-2 h-4 w-4" />
                                        {uploading
                                            ? 'Uploading...'
                                            : team.icon_url
                                              ? 'Change icon'
                                              : 'Upload icon'}
                                    </Button>
                                    {team.icon_url && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleIconRemove}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Remove
                                        </Button>
                                    )}
                                </div>
                            </div>

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
                            <div className="flex items-center gap-4">
                                <Avatar className="size-16">
                                    <AvatarImage
                                        src={team.icon_url ?? undefined}
                                        alt={team.name}
                                    />
                                    <AvatarFallback className="text-lg">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
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
                            <div className="space-y-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                                <div className="relative space-y-0.5 text-destructive">
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
