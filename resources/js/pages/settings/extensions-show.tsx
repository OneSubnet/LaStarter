import { Head, router, usePage } from '@inertiajs/react';
import { Download, Globe, Package, PackageX, Power, PowerOff, RefreshCw, Tag } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Guard from '@/components/guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TeamSettingsLayout from '@/layouts/team-settings-layout';
import { extensions as extensionsUrl } from '@/routes/settings/team';
import {
    disable as disableUrl,
    enable as enableUrl,
    install as installUrl,
    uninstall as uninstallUrl,
    update as updateUrl,
} from '@/routes/settings/team/extensions';

type Extension = {
    id: number;
    identifier: string;
    name: string;
    type: 'module' | 'theme';
    version: string | null;
    description: string | null;
    author: string | null;
    state: string | null;
    permissions: string[];
    is_enabled: boolean;
    has_routes: boolean;
    has_migrations: boolean;
    update_available: boolean;
    latest_version: string | null;
};

type Props = {
    extension: Extension;
};

export default function ExtensionsShow({ extension }: Props) {
    const { t } = useTranslation();
    const { currentTeam } = usePage().props;
    const teamSlug = (currentTeam as { slug: string } | null)?.slug ?? '';

    const stateConfig = useMemo<
        Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }>
    >(
        () => ({
            enabled: { label: t('settings.extensions.status_enabled'), variant: 'default' },
            disabled: { label: t('settings.extensions.status_disabled'), variant: 'secondary' },
            installed: { label: t('settings.extensions.status_installed'), variant: 'outline' },
            errored: { label: t('settings.extensions.status_error'), variant: 'destructive' },
        }),
        [t],
    );

    const displayState = extension.is_enabled
        ? 'enabled'
        : extension.state === 'enabled'
          ? 'disabled'
          : extension.state ?? 'installed';

    const config = stateConfig[displayState] ?? stateConfig.installed;

    const postAction = (url: string) => {
        router.post(url, {}, { preserveScroll: true });
    };

    return (
        <TeamSettingsLayout
            activeTab="Extensions"
            wide
            breadcrumbs={[
                { title: t('settings.extensions.title'), href: extensionsUrl(teamSlug).url },
                { title: extension.name, href: '#' },
            ]}
        >
            <Head title={`${extension.name} - ${t('settings.extensions.title')}`} />

            <div className="space-y-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold tracking-tight">{extension.name}</h2>
                            <Badge variant={config.variant}>{config.label}</Badge>
                            <Badge variant="outline" className="capitalize">{extension.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{extension.description}</p>
                    </div>

                    <Guard permission="extension.manage">
                        <div className="flex items-center gap-2">
                            {!extension.state && (
                                <Button
                                    onClick={() =>
                                        postAction(
                                            installUrl({ current_team: teamSlug, extension: extension.identifier }).url,
                                        )
                                    }
                                >
                                    <Download className="h-4 w-4" />
                                    {t('settings.extensions.install')}
                                </Button>
                            )}
                            {extension.state && extension.state !== 'errored' && (
                                <>
                                    {extension.is_enabled ? (
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                postAction(
                                                    disableUrl({ current_team: teamSlug, extension: extension.identifier }).url,
                                                )
                                            }
                                        >
                                            <PowerOff className="h-4 w-4" />
                                            {t('settings.extensions.disable')}
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() =>
                                                postAction(
                                                    enableUrl({ current_team: teamSlug, extension: extension.identifier }).url,
                                                )
                                            }
                                        >
                                            <Power className="h-4 w-4" />
                                            {t('settings.extensions.enable')}
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() =>
                                            postAction(
                                                uninstallUrl({ current_team: teamSlug, extension: extension.identifier }).url,
                                            )
                                        }
                                    >
                                        <PackageX className="h-4 w-4" />
                                        {t('settings.extensions.uninstall')}
                                    </Button>
                                </>
                            )}
                            {extension.update_available && extension.latest_version && (
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        postAction(
                                            updateUrl({ current_team: teamSlug, extension: extension.identifier }).url,
                                        )
                                    }
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    {t('settings.extensions.update')} (v{extension.latest_version})
                                </Button>
                            )}
                        </div>
                    </Guard>
                </div>

                {extension.update_available && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            {t('settings.extensions.update_available', { version: extension.latest_version })}
                        </p>
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-lg border p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Tag className="h-4 w-4" />
                            {t('settings.extensions.version')}
                        </div>
                        <p className="mt-1 font-medium">{extension.version ? `v${extension.version}` : '—'}</p>
                    </div>

                    {extension.author && (
                        <div className="rounded-lg border p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Globe className="h-4 w-4" />
                                {t('settings.extensions.author')}
                            </div>
                            <p className="mt-1 font-medium">{extension.author}</p>
                        </div>
                    )}

                    <div className="rounded-lg border p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Package className="h-4 w-4" />
                            {t('settings.extensions.status_label')}
                        </div>
                        <div className="mt-1">
                            <Badge variant={config.variant}>{config.label}</Badge>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                        {t('settings.extensions.identifier')}
                    </h3>
                    <code className="rounded bg-muted px-2 py-1 text-sm">{extension.identifier}</code>
                </div>

                {extension.permissions.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">
                            {t('settings.extensions.permissions_title')} ({extension.permissions.length})
                        </h3>
                        <div className="flex flex-wrap gap-1">
                            {extension.permissions.map((perm) => (
                                <code key={perm} className="rounded bg-muted px-1.5 py-0.5 text-xs">
                                    {perm}
                                </code>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex gap-4 text-sm text-muted-foreground">
                    {extension.has_routes && <Badge variant="outline">{t('settings.extensions.has_routes')}</Badge>}
                    {extension.has_migrations && <Badge variant="outline">{t('settings.extensions.has_migrations')}</Badge>}
                </div>
            </div>
        </TeamSettingsLayout>
    );
}
