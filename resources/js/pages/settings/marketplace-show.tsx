import { Head, router, usePage } from '@inertiajs/react';
import { Download, ExternalLink, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Guard from '@/components/guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TeamSettingsLayout from '@/layouts/team-settings-layout';
import { marketplace as marketplaceUrl } from '@/routes/settings/team';
import { install as installUrl } from '@/routes/settings/team/marketplace';

type MarketplaceDetail = {
    identifier: string;
    name: string;
    description: string;
    type: 'module' | 'theme';
    version: string | null;
    author: string | null;
    owner: string;
    repo: string;
    github_url: string | null;
    permissions: string[];
};

type Props = {
    extension: MarketplaceDetail;
};

export default function MarketplaceShow({ extension }: Props) {
    const { t } = useTranslation();
    const { currentTeam } = usePage().props;
    const teamSlug = (currentTeam as { slug: string } | null)?.slug ?? '';

    return (
        <TeamSettingsLayout
            activeTab="Extensions"
            wide
            breadcrumbs={[
                { title: t('settings.marketplace.title'), href: marketplaceUrl(teamSlug).url },
                { title: extension.name, href: '#' },
            ]}
        >
            <Head title={`${extension.name} - ${t('settings.marketplace.title')}`} />

            <div className="space-y-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold tracking-tight">{extension.name}</h2>
                            <Badge variant="outline" className="capitalize">{extension.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{extension.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Guard permission="extension.manage">
                            <Button
                                onClick={() =>
                                    router.post(installUrl(teamSlug).url, {
                                        owner: extension.owner,
                                        repo: extension.repo,
                                    })
                                }
                            >
                                <Download className="h-4 w-4" />
                                {t('settings.marketplace.install')}
                            </Button>
                        </Guard>
                        {extension.github_url && (
                            <Button variant="outline" asChild>
                                <a href={extension.github_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                    {t('settings.marketplace.view_on_github')}
                                </a>
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    {extension.version && (
                        <div className="rounded-lg border p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Tag className="h-4 w-4" />
                                {t('settings.extensions.version')}
                            </div>
                            <p className="mt-1 font-medium">v{extension.version}</p>
                        </div>
                    )}
                    {extension.author && (
                        <div className="rounded-lg border p-4">
                            <div className="text-sm text-muted-foreground">
                                {t('settings.extensions.author')}
                            </div>
                            <p className="mt-1 font-medium">{extension.author}</p>
                        </div>
                    )}
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

                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                        {t('settings.extensions.identifier')}
                    </h3>
                    <code className="rounded bg-muted px-2 py-1 text-sm">{extension.identifier}</code>
                </div>
            </div>
        </TeamSettingsLayout>
    );
}
