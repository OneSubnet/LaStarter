import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    ExternalLink,
    Globe,
    Hash,
    Package,
    Shield,
    Tag,
} from 'lucide-react';
import Guard from '@/components/guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Heading from '@/components/heading';
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

const stateConfig: Record<
    ExtensionState,
    {
        label: string;
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
    }
> = {
    enabled: { label: 'Active', variant: 'default' },
    disabled: { label: 'Disabled', variant: 'secondary' },
    not_installed: { label: 'Not Installed', variant: 'outline' },
    errored: { label: 'Error', variant: 'destructive' },
    incompatible: { label: 'Incompatible', variant: 'destructive' },
};

export default function ExtensionsShow({ extension }: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = (currentTeam as { slug: string } | null)?.slug ?? '';
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
                    title: 'Extensions',
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
                                    Install
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
                                                Disable
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
                                                Enable
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
                                            Uninstall
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
                                Error
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
                            Version
                        </div>
                        <p className="mt-1 font-medium">
                            v{extension.version}
                        </p>
                    </div>

                    {extension.author && (
                        <div className="rounded-lg border p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Globe className="h-4 w-4" />
                                Author
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
                                License
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
                                Installed
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
                                Requires
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
                                Homepage
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
                            Keywords
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
                        Identifier
                    </h3>
                    <code className="rounded bg-muted px-2 py-1 text-sm">
                        {extension.identifier}
                    </code>
                </div>
            </div>
        </TeamSettingsLayout>
    );
}
