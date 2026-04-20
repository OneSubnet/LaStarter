import { Head, router, usePage } from '@inertiajs/react';
import { Download, ExternalLink, Star } from 'lucide-react';
import { useState } from 'react';
import Guard from '@/components/guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TeamSettingsLayout from '@/layouts/team-settings-layout';
import { marketplace as marketplaceUrl } from '@/routes/settings/team';
import { install as installUrl } from '@/routes/settings/team/marketplace';

type Props = {
    details: {
        name: string;
        full_name: string;
        description: string | null;
        html_url: string;
        stargazers_count: number;
        topics: string[];
        license: string | null;
        default_branch: string;
        updated_at: string;
    };
    readme: string | null;
    release: {
        tag_name: string;
        name: string;
        body: string | null;
        published_at: string;
        zip_url: string | null;
        html_url: string;
    } | null;
    manifest: {
        name?: string;
        identifier?: string;
        description?: string;
        version?: string;
        author?: string;
        type?: string;
        license?: string;
        keywords?: string[];
        lastarterVersion?: string;
    } | null;
    installed: boolean;
};

export default function MarketplaceShow({
    details,
    readme,
    release,
    manifest,
    installed,
}: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = (currentTeam as { slug: string } | null)?.slug ?? '';
    const [installing, setInstalling] = useState(false);

    const [owner, repo] = details.full_name.split('/');

    const handleInstall = () => {
        setInstalling(true);
        router.post(
            installUrl(teamSlug).url,
            { owner, repo },
            {
                preserveScroll: true,
                onFinish: () => setInstalling(false),
            },
        );
    };

    return (
        <TeamSettingsLayout
            activeTab="Extensions"
            wide
            breadcrumbs={[
                {
                    title: 'Marketplace',
                    href: marketplaceUrl(teamSlug).url,
                },
                { title: details.name, href: '#' },
            ]}
        >
            <Head title={`Marketplace - ${details.name}`} />

            <div className="space-y-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold tracking-tight">
                                {manifest?.name || details.name}
                            </h2>
                            {manifest?.type && (
                                <Badge variant="outline" className="capitalize">
                                    {manifest.type}
                                </Badge>
                            )}
                            {details.license && (
                                <Badge variant="secondary">
                                    {details.license}
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {manifest?.description || details.description}
                        </p>
                        {manifest?.author && (
                            <p className="text-sm text-muted-foreground">
                                by {manifest.author}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {installed ? (
                            <Badge variant="default">Installed</Badge>
                        ) : (
                            <Guard permission="extension.manage">
                                <Button
                                    onClick={handleInstall}
                                    disabled={installing || !release?.zip_url}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    {installing
                                        ? 'Installing...'
                                        : 'Install'}
                                </Button>
                            </Guard>
                        )}
                        <a
                            href={details.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button variant="outline" size="sm">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                GitHub
                            </Button>
                        </a>
                    </div>
                </div>

                {/* Metadata */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {manifest?.version && (
                        <div className="rounded-lg border p-3">
                            <div className="text-xs text-muted-foreground">
                                Version
                            </div>
                            <p className="font-medium">
                                v{manifest.version}
                            </p>
                        </div>
                    )}
                    {release && (
                        <div className="rounded-lg border p-3">
                            <div className="text-xs text-muted-foreground">
                                Latest Release
                            </div>
                            <p className="font-medium">{release.tag_name}</p>
                        </div>
                    )}
                    <div className="rounded-lg border p-3">
                        <div className="text-xs text-muted-foreground">
                            Stars
                        </div>
                        <p className="flex items-center gap-1 font-medium">
                            <Star className="h-4 w-4 text-amber-500" />
                            {details.stargazers_count}
                        </p>
                    </div>
                    {manifest?.lastarterVersion && (
                        <div className="rounded-lg border p-3">
                            <div className="text-xs text-muted-foreground">
                                Requires
                            </div>
                            <p className="font-medium">
                                LaStarter {manifest.lastarterVersion}
                            </p>
                        </div>
                    )}
                </div>

                {/* Keywords */}
                {manifest?.keywords && manifest.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {manifest.keywords.map((keyword) => (
                            <Badge key={keyword} variant="secondary">
                                {keyword}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* README */}
                {readme && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">
                            README
                        </h3>
                        <div className="prose prose-sm max-w-none rounded-lg border p-6 dark:prose-invert">
                            <div
                                dangerouslySetInnerHTML={{ __html: readme }}
                            />
                        </div>
                    </div>
                )}

                {/* Release notes */}
                {release?.body && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">
                            Latest Release Notes
                        </h3>
                        <div className="prose prose-sm max-w-none rounded-lg border p-6 dark:prose-invert">
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: release.body,
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </TeamSettingsLayout>
    );
}
