import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ExternalLink,
    Globe,
    Hash,
    Package,
    Shield,
    Tag,
} from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Guard from '@/components/guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TeamSettingsLayout from '@/layouts/team-settings-layout';
import { extensions as extensionsUrl } from '@/routes/settings/team';
import {
    enable as enableUrl,
    disable as disableUrl,
    install as installUrl,
    uninstall as uninstallUrl,
} from '@/routes/settings/team/extensions';

type ExtensionState =
    | 'not_installed'
    | 'enabled'
    | 'disabled'
    | 'errored'
    | 'incompatible';

type Extension = {
    id: number;
    name: string;
    identifier: string;
    type: 'module' | 'theme';
    version: string;
    description: string;
    author: string | null;
    state: ExtensionState;
    error_message: string | null;
    installed_at: string | null;
    is_active: boolean;
    is_enabled_for_team: boolean;
    team_state: string;
    license: string | null;
    homepage: string | null;
    keywords: string[];
    lastarter_version: string | null;
    settings: { key: string; label: string; type: string; default?: string; options?: { label: string; value: string }[] }[];
};

type Props = {
    extension: Extension;
};

export default function ExtensionsShow({ extension }: Props) {
    const { t } = useTranslation();
    const { currentTeam } = usePage().props;
    const teamSlug = (currentTeam as { slug: string } | null)?.slug ?? '';

    const stateConfig = useMemo<Record<
        ExtensionState,
        {
            label: string;
            variant: 'default' | 'secondary' | 'destructive' | 'outline';
        }
    >>(() => ({
        enabled: { label: t('settings.extensions.status_active'), variant: 'default' },
        disabled: { label: t('settings.extensions.status_disabled'), variant: 'secondary' },
        not_installed: { label: t('settings.extensions.status_not_installed'), variant: 'outline' },
        errored: { label: t('settings.extensions.status_error'), variant: 'destructive' },
        incompatible: { label: t('settings.extensions.status_incompatible'), variant: 'destructive' },
    }), [t]);

    const config = stateConfig[extension.state];

    const postAction = (url: string) => {
        router.post(url, {}, { preserveScroll: true });
    };

    return (
        <TeamSettingsLayout
            activeTab="Extensions"
            wide
            breadcrumbs={[
                {
                    title: t('settings.extensions.title'),
                    href: extensionsUrl(teamSlug).url,
                },
                { title: extension.name, href: '#' },
            ]}
        >
            <Head title={`Extension - ${extension.name}`} />

            <div className="space-y-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold tracking-tight">
                                {extension.name}
                            </h2>
                            <Badge variant={config.variant}>
                                {config.label}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                                {extension.type}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {extension.description}
                        </p>
                    </div>

                    <Guard permission="extension.manage">
                        <div className="flex items-center gap-2">
                            {extension.state === 'not_installed' && (
                                <Button
                                    onClick={() =>
                                        postAction(
                                            installUrl({
                                                current_team: teamSlug,
                                                extension: extension.id,
                                            }).url,
                                        )
                                    }
                                >
                                    {t('settings.extensions.install')}
                                </Button>
                            )}
                            {extension.state !== 'not_installed' &&
                                extension.state !== 'errored' &&
                                extension.state !== 'incompatible' && (
                                    <>
                                        {extension.is_enabled_for_team ? (
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    postAction(
                                                        disableUrl({
                                                            current_team:
                                                                teamSlug,
                                                            extension:
                                                                extension.id,
                                                        }).url,
                                                    )
                                                }
                                            >
                                                {t('settings.extensions.disable')}
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() =>
                                                    postAction(
                                                        enableUrl({
                                                            current_team:
                                                                teamSlug,
                                                            extension:
                                                                extension.id,
                                                        }).url,
                                                    )
                                                }
                                            >
                                                {t('settings.extensions.enable')}
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() =>
                                                postAction(
                                                    uninstallUrl({
                                                        current_team: teamSlug,
                                                        extension: extension.id,
                                                    }).url,
                                                )
                                            }
                                        >
                                            {t('settings.extensions.uninstall')}
                                        </Button>
                                    </>
                                )}
                        </div>
                    </Guard>
                </div>

                {extension.error_message && (
                    <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                        <div>
                            <p className="font-medium text-destructive">
                                {t('settings.extensions.error_message')}
                            </p>
                            <p className="mt-1 text-sm text-destructive/80">
                                {extension.error_message}
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-lg border p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Tag className="h-4 w-4" />
                            {t('settings.extensions.version')}
                        </div>
                        <p className="mt-1 font-medium">
                            v{extension.version}
                        </p>
                    </div>

                    {extension.author && (
                        <div className="rounded-lg border p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Globe className="h-4 w-4" />
                                {t('settings.extensions.author')}
                            </div>
                            <p className="mt-1 font-medium">
                                {extension.author}
                            </p>
                        </div>
                    )}

                    {extension.license && (
                        <div className="rounded-lg border p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Shield className="h-4 w-4" />
                                {t('settings.extensions.license')}
                            </div>
                            <p className="mt-1 font-medium">
                                {extension.license}
                            </p>
                        </div>
                    )}

                    {extension.installed_at && (
                        <div className="rounded-lg border p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Package className="h-4 w-4" />
                                {t('settings.extensions.installed')}
                            </div>
                            <p className="mt-1 font-medium">
                                {new Date(extension.installed_at).toLocaleDateString()}
                            </p>
                        </div>
                    )}

                    {extension.lastarter_version && (
                        <div className="rounded-lg border p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Hash className="h-4 w-4" />
                                {t('settings.extensions.requires')}
                            </div>
                            <p className="mt-1 font-medium">
                                LaStarter {extension.lastarter_version}
                            </p>
                        </div>
                    )}

                    {extension.homepage && (
                        <div className="rounded-lg border p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <ExternalLink className="h-4 w-4" />
                                {t('settings.extensions.homepage')}
                            </div>
                            <a
                                href={extension.homepage}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 block font-medium text-primary underline-offset-4 hover:underline"
                            >
                                {extension.homepage}
                            </a>
                        </div>
                    )}
                </div>

                {extension.keywords.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">
                            {t('settings.extensions.keywords')}
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                            {extension.keywords.map((keyword) => (
                                <Badge key={keyword} variant="secondary">
                                    {keyword}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                        {t('settings.extensions.identifier')}
                    </h3>
                    <code className="rounded bg-muted px-2 py-1 text-sm">
                        {extension.identifier}
                    </code>
                </div>
            </div>
        </TeamSettingsLayout>
    );
}
