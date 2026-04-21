import { Head, Link, router, usePage } from '@inertiajs/react';
import { Download, ExternalLink, Search, Star } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Guard from '@/components/guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import TeamSettingsLayout from '@/layouts/team-settings-layout';
import { marketplace as marketplaceUrl } from '@/routes/settings/team';
import { install as installUrl, show as showUrl } from '@/routes/settings/team/marketplace';

type Repo = {
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    stargazers_count: number;
    topics: string[];
    updated_at: string;
    installed: boolean;
    type: string;
    identifier: string;
    path: string;
};

type Props = {
    results: Repo[];
    query: string;
    type: string;
};

export default function Marketplace({ results, query, type }: Props) {
    const { t } = useTranslation();
    const { currentTeam } = usePage().props;
    const teamSlug = (currentTeam as { slug: string } | null)?.slug ?? '';
    const [search, setSearch] = useState(query);
    const [typeFilter, setTypeFilter] = useState(type || 'all');

    const handleSearch = () => {
        router.get(
            marketplaceUrl(teamSlug).url,
            { q: search, type: typeFilter === 'all' ? '' : typeFilter },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <TeamSettingsLayout
            activeTab="Extensions"
            wide
            breadcrumbs={[
                {
                    title: t('settings.marketplace.title'),
                    href: marketplaceUrl(teamSlug).url,
                },
            ]}
        >
            <Head title={t('settings.marketplace.title')} />
            <h1 className="sr-only">{t('settings.marketplace.title')}</h1>

            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder={t('settings.marketplace.search_placeholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && handleSearch()
                            }
                            className="pl-9"
                        />
                    </div>
                    <Button onClick={handleSearch}>{t('settings.marketplace.search_button')}</Button>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('settings.marketplace.type_all')}</SelectItem>
                            <SelectItem value="module">{t('settings.marketplace.type_module')}</SelectItem>
                            <SelectItem value="theme">{t('settings.marketplace.type_theme')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {results.length === 0 ? (
                    <div className="py-16 text-center text-muted-foreground">
                        <Search className="mx-auto mb-4 h-12 w-12 opacity-20" />
                        <p className="text-sm">
                            {query
                                ? t('settings.marketplace.no_results')
                                : t('settings.marketplace.empty_message')}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {results.map((repo) => {
                            const [owner, name] = repo.full_name.split('/');

                            return (
                                <div
                                    key={repo.identifier}
                                    className="rounded-lg border p-4 transition-colors hover:border-foreground/20"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="min-w-0 flex-1">
                                            <Link
                                                href={`${showUrl({
                                                    current_team: teamSlug,
                                                    owner,
                                                    repo: name,
                                                }).url}?extension=${repo.identifier}`}
                                                className="font-medium hover:underline"
                                            >
                                                {repo.name}
                                            </Link>
                                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                                {repo.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className="text-xs capitalize"
                                        >
                                            {repo.type}
                                        </Badge>
                                        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                                            <Star className="h-3 w-3 text-yellow-500" />
                                            {repo.stargazers_count}
                                        </span>
                                    </div>

                                    <div className="mt-3 flex items-center gap-2">
                                        {repo.installed ? (
                                            <Badge variant="secondary">
                                                {t('settings.marketplace.installed')}
                                            </Badge>
                                        ) : (
                                            <Guard permission="extension.manage">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        router.post(
                                                            installUrl(teamSlug).url,
                                                            {
                                                                owner,
                                                                repo: name,
                                                                identifier: repo.identifier,
                                                            },
                                                        )
                                                    }
                                                >
                                                    <Download className="h-3 w-3" />
                                                    {t('settings.marketplace.install')}
                                                </Button>
                                            </Guard>
                                        )}
                                        <a
                                            href={repo.html_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-auto text-muted-foreground hover:text-foreground"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </TeamSettingsLayout>
    );
}
