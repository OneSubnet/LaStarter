import { Head, Link, router, usePage } from '@inertiajs/react';
import { Download, ExternalLink, Package, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import {
    install as installUrl,
    show as showUrl,
} from '@/routes/settings/team/marketplace';
import type { SharedData } from '@/types';
import type { MarketplaceExtension } from '@/types/extensions';

type Props = {
    extensions: MarketplaceExtension[];
};

export default function Marketplace({ extensions }: Props) {
    const { t } = useTranslation();
    const { currentTeam } = usePage<SharedData>().props;
    const teamSlug = currentTeam?.slug ?? '';
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'module' | 'theme'>(
        'all',
    );

    const filtered = useMemo(() => {
        let result = extensions;

        if (typeFilter !== 'all') {
            result = result.filter((ext) => ext.type === typeFilter);
        }

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (ext) =>
                    ext.name.toLowerCase().includes(q) ||
                    ext.description?.toLowerCase().includes(q) ||
                    ext.identifier.toLowerCase().includes(q),
            );
        }

        return result;
    }, [extensions, search, typeFilter]);

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
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder={t('settings.marketplace.search')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select
                        value={typeFilter}
                        onValueChange={(v) =>
                            setTypeFilter(v as 'all' | 'module' | 'theme')
                        }
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                {t('settings.marketplace.type_all')}
                            </SelectItem>
                            <SelectItem value="module">
                                {t('settings.marketplace.type_module')}
                            </SelectItem>
                            <SelectItem value="theme">
                                {t('settings.marketplace.type_theme')}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {filtered.length === 0 ? (
                    <div className="py-16 text-center text-muted-foreground">
                        <Package className="mx-auto mb-4 h-12 w-12 opacity-20" />
                        <p className="text-sm">
                            {search
                                ? t('settings.marketplace.no_results')
                                : t('settings.marketplace.empty_message')}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((ext) => (
                            <div
                                key={ext.identifier}
                                className="rounded-lg border p-4 transition-colors hover:border-foreground/20"
                            >
                                <div className="min-w-0 flex-1">
                                    {ext.owner && ext.repo ? (
                                        <Link
                                            href={
                                                showUrl({
                                                    current_team: teamSlug,
                                                    owner: ext.owner,
                                                    repo: ext.repo,
                                                }).url
                                            }
                                            className="font-medium hover:underline"
                                        >
                                            {ext.name}
                                        </Link>
                                    ) : (
                                        <span className="font-medium">
                                            {ext.name}
                                        </span>
                                    )}
                                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                        {ext.description}
                                    </p>
                                </div>

                                <div className="mt-3 flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className="text-xs capitalize"
                                    >
                                        {ext.type}
                                    </Badge>
                                    {ext.version && (
                                        <span className="text-xs text-muted-foreground">
                                            v{ext.version}
                                        </span>
                                    )}
                                    {ext.author && (
                                        <span className="text-xs text-muted-foreground">
                                            by {ext.author}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-3 flex items-center gap-2">
                                    <Guard permission="extension.manage">
                                        {ext.owner && ext.repo && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    router.post(
                                                        installUrl(teamSlug)
                                                            .url,
                                                        {
                                                            owner: ext.owner,
                                                            repo: ext.repo,
                                                        },
                                                    )
                                                }
                                            >
                                                <Download className="h-3 w-3" />
                                                {t(
                                                    'settings.marketplace.install',
                                                )}
                                            </Button>
                                        )}
                                    </Guard>
                                    {ext.github_url && (
                                        <a
                                            href={ext.github_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-auto text-muted-foreground hover:text-foreground"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </TeamSettingsLayout>
    );
}
