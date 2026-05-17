import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowUpDown,
    Download,
    FileText,
    RefreshCw,
    Search,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { SharedData } from '@/types';

type AuditLogItem = {
    id: number;
    user: string | null;
    action: string;
    module: string | null;
    subject_type: string | null;
    subject_id: number | null;
    properties: Record<string, unknown> | null;
    ip_address: string | null;
    trace_id: string | null;
    created_at: string | null;
};

type PaginatedLogs = {
    data: AuditLogItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

type Props = {
    logs: PaginatedLogs;
    filters: {
        search: string | null;
        action: string | null;
        module: string | null;
        user_id: number | null;
        from: string | null;
        to: string | null;
        sort: string;
        direction: string;
    };
    actions: string[];
    modules: string[];
    teamMembers: { id: number; name: string }[];
};

export default function AuditPage({ logs, filters, actions, modules, teamMembers }: Props) {
    const { t } = useTranslation();
    const { currentTeam } = usePage<SharedData>().props;
    const teamSlug = currentTeam?.slug ?? '';

    const [search, setSearch] = useState(filters.search ?? '');
    const [action, setAction] = useState(filters.action ?? '');
    const [module, setModule] = useState(filters.module ?? '');
    const [userId, setUserId] = useState(filters.user_id?.toString() ?? '');

    const reload = useCallback((params: Record<string, string>) => {
        const merged = { ...params };
        if (search) merged.search = search;
        if (action) merged.action = action;
        if (module) merged.module = module;
        if (userId) merged.user_id = userId;

        router.get(`/${teamSlug}/settings/audit`, merged, {
            preserveState: true,
            preserveScroll: true,
        });
    }, [teamSlug, search, action, module, userId]);

    const handleSearch = () => reload({ page: '1' });

    const handlePageChange = (url: string | null) => {
        if (!url) return;
        const params: Record<string, string> = { page: '1' };
        const u = new URL(url, window.location.origin);
        u.searchParams.forEach((v, k) => { params[k] = v; });
        router.get(url, {}, { preserveState: true, preserveScroll: true });
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        if (filters.from) params.set('from', filters.from);
        if (filters.to) params.set('to', filters.to);
        window.open(`/${teamSlug}/settings/audit/export?${params.toString()}`, '_blank');
    };

    const toggleSort = (field: string) => {
        reload({
            sort: field,
            direction: filters.sort === field && filters.direction === 'desc' ? 'asc' : 'desc',
            page: '1',
        });
    };

    const clearFilters = () => {
        setSearch('');
        setAction('');
        setModule('');
        setUserId('');
        router.get(`/${teamSlug}/settings/audit`, {}, { preserveState: true, preserveScroll: true });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: t('common.settings'), href: `/${teamSlug}/settings/general` },
                { title: t('settings.audit.title'), href: `/${teamSlug}/settings/audit` },
            ]}
        >
            <Head title={t('settings.audit.title')} />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{t('settings.audit.title')}</h1>
                        <p className="text-muted-foreground text-sm">{t('settings.audit.description')}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="mr-1.5 h-4 w-4" />
                        {t('settings.audit.export')}
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
                    <div className="min-w-[200px] flex-1">
                        <label className="text-muted-foreground mb-1 block text-xs font-medium">
                            {t('settings.audit.search')}
                        </label>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder={t('settings.audit.search_placeholder')}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    {actions.length > 0 && (
                        <div className="w-44">
                            <label className="text-muted-foreground mb-1 block text-xs font-medium">
                                {t('settings.audit.action')}
                            </label>
                            <Select value={action} onValueChange={(v) => { setAction(v === '__all' ? '' : v); reload({ page: '1', action: v === '__all' ? '' : v }); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('settings.audit.all_actions')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all">{t('settings.audit.all_actions')}</SelectItem>
                                    {actions.map((a) => (
                                        <SelectItem key={a} value={a}>{a}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {modules.length > 0 && (
                        <div className="w-44">
                            <label className="text-muted-foreground mb-1 block text-xs font-medium">
                                {t('settings.audit.module')}
                            </label>
                            <Select value={module} onValueChange={(v) => { setModule(v === '__all' ? '' : v); reload({ page: '1', module: v === '__all' ? '' : v }); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('settings.audit.all_modules')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all">{t('settings.audit.all_modules')}</SelectItem>
                                    {modules.map((m) => (
                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {teamMembers.length > 0 && (
                        <div className="w-44">
                            <label className="text-muted-foreground mb-1 block text-xs font-medium">
                                {t('settings.audit.user')}
                            </label>
                            <Select value={userId} onValueChange={(v) => { setUserId(v === '__all' ? '' : v); reload({ page: '1', user_id: v === '__all' ? '' : v }); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('settings.audit.all_users')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all">{t('settings.audit.all_users')}</SelectItem>
                                    {teamMembers.map((m) => (
                                        <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleSearch}>
                            <Search className="mr-1 h-3.5 w-3.5" />
                            {t('common.search')}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                            {t('common.clear')}
                        </Button>
                    </div>
                </div>

                {/* Results count */}
                <div className="text-muted-foreground text-sm">
                    {t('settings.audit.results', { count: logs.total })}
                </div>

                {/* Table */}
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">#</TableHead>
                                <TableHead>
                                    <button type="button" onClick={() => toggleSort('created_at')} className="flex items-center gap-1 hover:text-foreground">
                                        {t('settings.audit.date')}
                                        <ArrowUpDown className="h-3 w-3" />
                                    </button>
                                </TableHead>
                                <TableHead>{t('settings.audit.user')}</TableHead>
                                <TableHead>
                                    <button type="button" onClick={() => toggleSort('action')} className="flex items-center gap-1 hover:text-foreground">
                                        {t('settings.audit.action')}
                                        <ArrowUpDown className="h-3 w-3" />
                                    </button>
                                </TableHead>
                                <TableHead>{t('settings.audit.module')}</TableHead>
                                <TableHead>{t('settings.audit.subject')}</TableHead>
                                <TableHead>{t('settings.audit.ip')}</TableHead>
                                <TableHead>{t('settings.audit.details')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-24 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText className="h-8 w-8 text-muted-foreground/30" />
                                            <p className="text-muted-foreground text-sm">{t('settings.audit.empty')}</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.data.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-muted-foreground text-xs">{log.id}</TableCell>
                                        <TableCell className="whitespace-nowrap text-xs">
                                            {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                                        </TableCell>
                                        <TableCell className="text-sm">{log.user ?? '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">{log.action}</Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs">
                                            {log.module ?? '-'}
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate text-xs">
                                            {log.subject_type
                                                ? `${log.subject_type.split('\\').pop()}#${log.subject_id}`
                                                : '-'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs font-mono">
                                            {log.ip_address ?? '-'}
                                        </TableCell>
                                        <TableCell>
                                            {log.properties ? (
                                                <details className="cursor-pointer">
                                                    <summary className="text-muted-foreground text-xs hover:text-foreground">
                                                        {t('settings.audit.view_details')}
                                                    </summary>
                                                    <pre className="mt-1 max-w-xs overflow-auto rounded bg-muted p-2 text-[10px]">
                                                        {JSON.stringify(log.properties, null, 2)}
                                                    </pre>
                                                </details>
                                            ) : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {logs.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-sm">
                            {t('settings.audit.page_info', { current: logs.current_page, total: logs.last_page })}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!logs.prev_page_url}
                                onClick={() => handlePageChange(logs.prev_page_url)}
                            >
                                {t('common.previous')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!logs.next_page_url}
                                onClick={() => handlePageChange(logs.next_page_url)}
                            >
                                {t('common.next')}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
