import { Head, router } from '@inertiajs/react';
import { useForm as useTanStackForm } from '@tanstack/react-form';
import { Camera, Plus, Trash2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

type FooterLink = {
    title: string;
    href: string;
};

type Props = {
    team: {
        id: number;
        name: string;
        slug: string;
        isPersonal: boolean;
        icon_url: string | null;
    };
    footerLinks: FooterLink[];
    permissions: string[];
};

export default function TeamGeneral({ team, footerLinks: initialFooterLinks, permissions }: Props) {
    const { t } = useTranslation();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [serverErrors, setServerErrors] = useState<Record<string, string>>(
        {},
    );
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [footerLinks, setFooterLinks] = useState<FooterLink[]>(initialFooterLinks);
    const [savingFooterLinks, setSavingFooterLinks] = useState(false);

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
            <Head title={`${t('common.general')} - ${team.name}`} />
            <h1 className="sr-only">{t('settings.team.general.title')}</h1>

            <div className="flex flex-col space-y-10">
                <div className="space-y-6">
                    {canUpdate ? (
                        <>
                            <Heading
                                variant="small"
                                title={t('settings.team.general.title')}
                                description={t('settings.team.general.description')}
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
                                        <Camera className="h-4 w-4" />
                                        {uploading
                                            ? t('settings.team.general.uploading')
                                            : team.icon_url
                                              ? t('settings.team.general.change_icon')
                                              : t('settings.team.general.upload_icon')}
                                    </Button>
                                    {team.icon_url && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleIconRemove}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            {t('settings.team.general.remove')}
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
                                    <Label htmlFor="name">{t('settings.team.general.name_label')}</Label>
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
                                                    disabled={false}
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
                                                        ? t('settings.team.general.saving')
                                                        : t('settings.team.general.save')}
                                                </Button>
                                            </div>
                                        )}
                                    </form.Subscribe>
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
                                <Label>{t('settings.team.general.name_label')}</Label>
                                <p className="text-sm text-muted-foreground">
                                    {team.name}
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer Links */}
                {canUpdate && (
                    <div className="space-y-4">
                        <Heading
                            variant="small"
                            title={t('settings.footer_links.title')}
                            description={t('settings.footer_links.description')}
                        />
                        <div className="space-y-3">
                            {footerLinks.map((link, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Input
                                        value={link.title}
                                        onChange={(e) => {
                                            const updated = [...footerLinks];
                                            updated[i] = { ...updated[i], title: e.target.value };
                                            setFooterLinks(updated);
                                        }}
                                        placeholder={t('settings.footer_links.title_placeholder')}
                                        className="flex-1"
                                    />
                                    <Input
                                        value={link.href}
                                        onChange={(e) => {
                                            const updated = [...footerLinks];
                                            updated[i] = { ...updated[i], href: e.target.value };
                                            setFooterLinks(updated);
                                        }}
                                        placeholder={t('settings.footer_links.url_placeholder')}
                                        className="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="shrink-0 text-muted-foreground hover:text-destructive"
                                        onClick={() => setFooterLinks(footerLinks.filter((_, idx) => idx !== i))}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setFooterLinks([...footerLinks, { title: '', href: '' }])}
                                >
                                    <Plus className="h-4 w-4" />
                                    {t('settings.footer_links.add')}
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={savingFooterLinks}
                                    onClick={() => {
                                        setSavingFooterLinks(true);
                                        router.post(
                                            `/${team.slug}/settings/general/footer-links`,
                                            { links: footerLinks },
                                            {
                                                preserveScroll: true,
                                                onFinish: () => setSavingFooterLinks(false),
                                            },
                                        );
                                    }}
                                >
                                    {savingFooterLinks ? t('settings.team.general.saving') : t('common.save')}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <Guard permission="team.delete">
                    {!team.isPersonal && canDelete ? (
                        <div className="space-y-6">
                            <Heading
                                variant="small"
                                title={t('settings.team.general.delete_title')}
                                description={t('settings.team.general.delete_description')}
                            />
                            <div className="space-y-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                                <div className="relative space-y-0.5 text-destructive">
                                    <p className="font-medium">{t('settings.team.general.warning')}</p>
                                    <p className="text-sm">
                                        {t('settings.team.general.warning_message')}
                                    </p>
                                </div>
                                <Button
                                    variant="destructive"
                                    data-test="delete-team-button"
                                    onClick={() => setDeleteDialogOpen(true)}
                                >
                                    {t('settings.team.general.delete_button')}
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
