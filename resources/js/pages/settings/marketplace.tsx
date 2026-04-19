import { Head, Link, router, usePage } from '@inertiajs/react';
import { Download, ExternalLink, Search, Star } from 'lucide-react';
import { useState } from 'react';
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
import { show as showUrl } from '@/routes/settings/team/marketplace';

type Repo = {
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    stargazers_count: number;
    topics: string[];
    updated_at: string;
    installed: boolean;
};

type Props = {
    results: Repo[];
    query: string;
    type: string;
};

export default function Marketplace({ results, query, type }: Props) {
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
                    title: 'Marketplace',
                    href: marketplaceUrl(teamSlug).url,
                },
            ]}
        >
            <Head title="Marketplace" />
            <h1 className="sr-only">Marketplace</h1>

            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search extensions..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && handleSearch()
                            }
                            className="pl-9"
                        />
                    </div>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All types</SelectItem>
                            <SelectItem value="module">Modules</SelectItem>
                            <SelectItem value="theme">Themes</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={handleSearch}>Search</Button>
                </div>

                {results.length === 0 ? (
                    <div className="py-16 text-center text-muted-foreground">
                        <Search className="mx-auto mb-4 h-12 w-12 opacity-20" />
                        <p className="text-sm">
                            {query
                                ? 'No extensions found matching your search.'
                                : 'Search for extensions from the GitHub marketplace.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {results.map((repo) => {
                            const [owner, name] = repo.full_name.split('/');
                            const shortName = name.replace(
                                /^lastarter-(module|theme)-/,
                                '',
                            );

                            return (
                                <div
                                    key={repo.full_name}
                                    className="rounded-lg border p-4 transition-colors hover:border-foreground/20"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="min-w-0 flex-1">
                                            <Link
                                                href={showUrl({
                                                    current_team: teamSlug,
                                                    owner,
                                                    repo: name,
                                                }).url}
                                                className="font-medium hover:underline"
                                            >
                                                {shortName}
                                            </Link>
                                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                                {repo.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center gap-2">
                                        {repo.topics
                                            .filter((t) =>
                                                t.startsWith('lastarter-'),
                                            )
                                            .map((topic) => (
                                                <Badge
                                                    key={topic}
                                                    variant="outline"
                                                    className="text-xs capitalize"
                                                >
                                                    {topic
                                                        .replace(
                                                            'lastarter-',
                                                            '',
                                                        )
                                                        .replace('-', ' ')}
                                                </Badge>
                                            ))}
                                        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                                            <Star className="h-3 w-3" />
                                            {repo.stargazers_count}
                                        </span>
                                    </div>

                                    <div className="mt-3 flex items-center gap-2">
                                        {repo.installed ? (
                                            <Badge variant="secondary">
                                                Installed
                                            </Badge>
                                        ) : (
                                            <Guard permission="extension.manage">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        router.post(
                                                            `/api/marketplace/install`,
                                                            {
                                                                owner,
                                                                repo: name,
                                                            },
                                                        )
                                                    }
                                                >
                                                    <Download className="mr-1 h-3 w-3" />
                                                    Install
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
