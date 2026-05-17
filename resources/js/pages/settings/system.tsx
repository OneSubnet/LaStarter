import { Head, router, usePage } from '@inertiajs/react';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import type {
    ColumnDef,
    SortingState,
    VisibilityState,
} from '@tanstack/react-table';
import {
    ArrowUpDown,
    CheckCircle2,
    Database,
    Download,
    HardDrive,
    Loader2,
    Package,
    Plus,
    RefreshCw,
    RotateCcw,
    Server,
    Trash2,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Guard from '@/components/guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import TeamSettingsLayout from '@/layouts/team-settings-layout';
import { formatBytes, formatDateTime } from '@/lib/format';
import type { SharedData } from '@/types';

type BackupItem = {
    filename: string;
    type: string;
    size: number;
    created_at: string;
};

type Props = {
    coreVersion: string;
    latestVersion: string | null;
    changelog: string | null;
    updateAvailable: boolean;
    backups: BackupItem[];
};

export default function System({
    coreVersion,
    latestVersion,
    changelog,
    updateAvailable,
    backups,
}: Props) {
    const { t } = useTranslation();
    const { currentTeam } = usePage<SharedData>().props;
    const teamSlug = (currentTeam as { slug: string } | null)?.slug;

    const [checkingCore, setCheckingCore] = useState(false);
    const [updatingCore, setUpdatingCore] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [restoreTarget, setRestoreTarget] = useState<string | null>(null);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {},
    );

    const postAction = (url: string, data: Record<string, string> = {}) => {
        router.post(url, data, { preserveScroll: true });
    };

    const handleDownload = useCallback(
        async (filename: string) => {
            try {
                const response = await fetch(
                    `/${teamSlug}/settings/system/backups/download-url`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            'X-CSRF-TOKEN':
                                document
                                    .querySelector('meta[name="csrf-token"]')
                                    ?.getAttribute('content') ?? '',
                        },
                        body: JSON.stringify({ filename }),
                    },
                );

                const data = await response.json();
                const link = document.createElement('a');
                link.href = data.url;
                link.download = filename;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch {
                // Download failed silently
            }
        },
        [teamSlug],
    );

    const handleCheckCore = useCallback(() => {
        if (!teamSlug) {
            return;
        }

        setCheckingCore(true);
        router.post(
            `/${teamSlug}/settings/system/check-core`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setCheckingCore(false),
            },
        );
    }, [teamSlug]);

    const handleUpdateCore = useCallback(() => {
        if (!teamSlug) {
            return;
        }

        setUpdatingCore(true);
        router.post(
            `/${teamSlug}/settings/system/update-core`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setUpdatingCore(false),
            },
        );
    }, [teamSlug]);

    const typeVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
        core: 'default',
        extension: 'secondary',
        database: 'outline',
    };

    const columns = useMemo<ColumnDef<BackupItem>[]>(
        () => [
            {
                accessorKey: 'filename',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === 'asc')
                        }
                    >
                        {t('settings.backups.col_filename')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <span className="font-mono text-sm">
                        {row.getValue('filename')}
                    </span>
                ),
            },
            {
                accessorKey: 'type',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === 'asc')
                        }
                    >
                        {t('settings.backups.col_type')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <Badge
                        variant={
                            typeVariants[row.getValue('type') as string] ??
                            'outline'
                        }
                    >
                        {t(
                            `settings.backups.type_${row.getValue('type') as string}`,
                        )}
                    </Badge>
                ),
                filterFn: (row, _id, value) =>
                    (row.getValue('type') as string) === value,
            },
            {
                accessorKey: 'size',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === 'asc')
                        }
                    >
                        {t('settings.backups.col_size')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => formatBytes(row.getValue('size') as number),
            },
            {
                accessorKey: 'created_at',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === 'asc')
                        }
                    >
                        {t('settings.backups.col_date')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) =>
                    formatDateTime(row.getValue('created_at') as string),
            },
            {
                id: 'actions',
                header: () => (
                    <span className="text-right">
                        {t('settings.backups.col_actions')}
                    </span>
                ),
                cell: ({ row }) => (
                    <div className="flex justify-end gap-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        handleDownload(row.original.filename)
                                    }
                                >
                                    <Download className="size-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {t('common.download')}
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        setRestoreTarget(row.original.filename)
                                    }
                                >
                                    <RotateCcw className="size-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {t('settings.backups.restore')}
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() =>
                                        setDeleteTarget(row.original.filename)
                                    }
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {t('common.delete')}
                            </TooltipContent>
                        </Tooltip>
                    </div>
                ),
                enableHiding: false,
            },
        ],
        [t, handleDownload, typeVariants],
    );

    const table = useReactTable({
        data: backups,
        columns,
        state: { sorting, globalFilter, columnVisibility },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 10 } },
    });

    return (
        <TeamSettingsLayout
            activeTab="System"
            breadcrumbs={[
                {
                    title: t('settings.system.title'),
                    href: teamSlug ? `/${teamSlug}/settings/system` : '',
                },
            ]}
        >
            <Head title={t('settings.system.title')} />

            <div className="space-y-6">
                {/* Core Platform */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                    <Server className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>
                                        {t('settings.system.core_platform')}
                                    </CardTitle>
                                    <CardDescription>
                                        {t('settings.system.version')}: v
                                        {coreVersion}
                                    </CardDescription>
                                </div>
                            </div>
                            {updateAvailable ? (
                                <Badge variant="default">
                                    {t('settings.system.update_available', {
                                        version: latestVersion,
                                    })}
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {t('settings.system.up_to_date')}
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {changelog && (
                            <div className="rounded-lg border bg-muted/50 p-4">
                                <h4 className="mb-2 text-sm font-medium">
                                    {t('settings.system.changelog')}
                                </h4>
                                <div className="prose prose-sm max-h-48 overflow-y-auto text-muted-foreground">
                                    <pre className="font-sans text-sm whitespace-pre-wrap">
                                        {changelog}
                                    </pre>
                                </div>
                            </div>
                        )}

                        <Guard permission="system.update">
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCheckCore}
                                    disabled={checkingCore || updatingCore}
                                >
                                    {checkingCore ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="h-4 w-4" />
                                    )}
                                    {t('settings.system.check_updates')}
                                </Button>

                                {updateAvailable && (
                                    <Button
                                        size="sm"
                                        onClick={handleUpdateCore}
                                        disabled={updatingCore}
                                    >
                                        {updatingCore ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Download className="h-4 w-4" />
                                        )}
                                        {t('settings.system.update_core')}
                                    </Button>
                                )}
                            </div>
                        </Guard>
                    </CardContent>
                </Card>

                {/* Backups */}
                <Guard permission="system.update">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <HardDrive className="size-5" />
                                    {t('settings.backups.core_title')}
                                </CardTitle>
                                <CardDescription>
                                    {t('settings.backups.core_description')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    onClick={() =>
                                        postAction(
                                            `/${teamSlug}/settings/system/backups/core`,
                                        )
                                    }
                                >
                                    <Plus className="size-4" />
                                    {t('settings.backups.create_core')}
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Database className="size-5" />
                                    {t('settings.backups.database_title')}
                                </CardTitle>
                                <CardDescription>
                                    {t('settings.backups.database_description')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    variant="secondary"
                                    onClick={() =>
                                        postAction(
                                            `/${teamSlug}/settings/system/backups/database`,
                                        )
                                    }
                                >
                                    <Plus className="size-4" />
                                    {t('settings.backups.create_database')}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </Guard>

                {/* Backups Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="size-5" />
                            {t('settings.backups.all_backups')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {backups.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                {t('settings.backups.empty')}
                            </p>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Input
                                        placeholder={t('common.search') + '...'}
                                        aria-label={t('a11y.search')}
                                        value={globalFilter}
                                        onChange={(e) =>
                                            setGlobalFilter(e.target.value)
                                        }
                                        className="max-w-sm"
                                    />
                                </div>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            {table
                                                .getHeaderGroups()
                                                .map((headerGroup) => (
                                                    <TableRow
                                                        key={headerGroup.id}
                                                    >
                                                        {headerGroup.headers.map(
                                                            (header) => (
                                                                <TableHead
                                                                    key={
                                                                        header.id
                                                                    }
                                                                >
                                                                    {header.isPlaceholder
                                                                        ? null
                                                                        : flexRender(
                                                                              header
                                                                                  .column
                                                                                  .columnDef
                                                                                  .header,
                                                                              header.getContext(),
                                                                          )}
                                                                </TableHead>
                                                            ),
                                                        )}
                                                    </TableRow>
                                                ))}
                                        </TableHeader>
                                        <TableBody>
                                            {table.getRowModel().rows.length >
                                            0 ? (
                                                table
                                                    .getRowModel()
                                                    .rows.map((row) => (
                                                        <TableRow key={row.id}>
                                                            {row
                                                                .getVisibleCells()
                                                                .map((cell) => (
                                                                    <TableCell
                                                                        key={
                                                                            cell.id
                                                                        }
                                                                    >
                                                                        {flexRender(
                                                                            cell
                                                                                .column
                                                                                .columnDef
                                                                                .cell,
                                                                            cell.getContext(),
                                                                        )}
                                                                    </TableCell>
                                                                ))}
                                                        </TableRow>
                                                    ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={columns.length}
                                                        className="h-24 text-center"
                                                    >
                                                        {t('common.no_results')}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">
                                        {t('common.rows_per_page')}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => table.previousPage()}
                                            disabled={
                                                !table.getCanPreviousPage()
                                            }
                                        >
                                            {t('common.previous')}
                                        </Button>
                                        <span className="text-sm text-muted-foreground">
                                            {t('common.page_of', {
                                                current:
                                                    table.getState().pagination
                                                        .pageIndex + 1,
                                                total: table.getPageCount(),
                                            })}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => table.nextPage()}
                                            disabled={!table.getCanNextPage()}
                                        >
                                            {t('common.next')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog
                open={!!deleteTarget}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteTarget(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {t('settings.backups.delete_title')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('settings.backups.delete_description')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button variant="secondary">
                                {t('common.cancel')}
                            </Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (deleteTarget) {
                                    postAction(
                                        `/${teamSlug}/settings/system/backups/delete`,
                                        { filename: deleteTarget },
                                    );
                                    setDeleteTarget(null);
                                }
                            }}
                        >
                            {t('settings.backups.delete_confirm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!restoreTarget}
                onOpenChange={(open) => {
                    if (!open) {
                        setRestoreTarget(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {t('settings.backups.restore_title')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('settings.backups.restore_description')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button variant="secondary">
                                {t('common.cancel')}
                            </Button>
                        </DialogClose>
                        <Button
                            onClick={() => {
                                if (restoreTarget) {
                                    postAction(
                                        `/${teamSlug}/settings/system/backups/restore`,
                                        { filename: restoreTarget },
                                    );
                                    setRestoreTarget(null);
                                }
                            }}
                        >
                            <RotateCcw className="size-4" />
                            {t('settings.backups.restore_confirm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </TeamSettingsLayout>
    );
}
