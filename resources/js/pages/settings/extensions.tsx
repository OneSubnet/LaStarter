import { Head, router, usePage } from '@inertiajs/react';
import { type FormEvent } from 'react';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import type { ColumnDef, SortingState, VisibilityState } from '@tanstack/react-table';
import {
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ChevronDown,
    Columns3,
    Download,
    Eye,
    MoreVertical,
    PackageX,
    Power,
    PowerOff,
    Puzzle,
    Search,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Guard from '@/components/guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
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
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
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
    permissions: string[];
    settings: { key: string; label: string; type: string; default?: string; options?: { label: string; value: string }[] }[];
};

type Props = {
    extensions: Extension[];
};

export default function Extensions({ extensions }: Props) {
    const { t } = useTranslation();
    const { currentTeam } = usePage().props;
    const teamSlug = (currentTeam as { slug: string } | null)?.slug ?? '';
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [rowSelection, setRowSelection] = useState({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [detailExtension, setDetailExtension] = useState<Extension | null>(null);
    const [typeFilter, setTypeFilter] = useState<'all' | 'module' | 'theme'>('all');

    const stateConfig = useMemo<Record<
        ExtensionState,
        { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
    >>(() => ({
        enabled: { label: t('settings.extensions.status_active'), variant: 'default' },
        disabled: { label: t('settings.extensions.status_disabled'), variant: 'secondary' },
        not_installed: { label: t('settings.extensions.status_not_installed'), variant: 'outline' },
        errored: { label: t('settings.extensions.status_error'), variant: 'destructive' },
        incompatible: { label: t('settings.extensions.status_incompatible'), variant: 'destructive' },
    }), [t]);

    const filteredData = useMemo(() => {
        if (typeFilter === 'all') return extensions;
        return extensions.filter((ext) => ext.type === typeFilter);
    }, [extensions, typeFilter]);

    const postAction = useCallback(
        (url: string) => {
            router.post(url, {}, { preserveScroll: true });
        },
        [],
    );

    const columns = useMemo<ColumnDef<Extension>[]>(
        () => [
            {
                id: 'select',
                header: ({ table }) => (
                    <div className="flex items-center justify-center">
                        <Checkbox
                            checked={
                                table.getIsAllPageRowsSelected() ||
                                (table.getIsSomePageRowsSelected() && 'indeterminate')
                            }
                            onCheckedChange={(value) =>
                                table.toggleAllPageRowsSelected(!!value)
                            }
                            aria-label="Select all"
                        />
                    </div>
                ),
                cell: ({ row }) => (
                    <div className="flex items-center justify-center">
                        <Checkbox
                            checked={row.getIsSelected()}
                            onCheckedChange={(value) =>
                                row.toggleSelected(!!value)
                            }
                            aria-label="Select row"
                        />
                    </div>
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: 'name',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === 'asc')
                        }
                    >
                        {t('settings.extensions.table_name')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="min-w-[200px]">
                        <div className="font-medium">{row.original.name}</div>
                        <div className="max-w-[300px] truncate text-sm text-muted-foreground">
                            {row.original.description}
                        </div>
                    </div>
                ),
                enableHiding: false,
            },
            {
                accessorKey: 'type',
                header: t('settings.extensions.table_type'),
                cell: ({ row }) => (
                    <Badge variant="outline" className="capitalize">
                        {row.original.type}
                    </Badge>
                ),
            },
            {
                accessorKey: 'author',
                header: t('settings.extensions.table_author'),
                cell: ({ row }) => (
                    <span className="text-sm text-muted-foreground">
                        {row.original.author ?? '—'}
                    </span>
                ),
            },
            {
                accessorKey: 'version',
                header: t('settings.extensions.table_version'),
                cell: ({ row }) => (
                    <span className="text-sm tabular-nums text-muted-foreground">
                        v{row.original.version}
                    </span>
                ),
            },
            {
                accessorKey: 'state',
                header: t('settings.extensions.table_status'),
                cell: ({ row }) => {
                    const ext = row.original;
                    const displayState: ExtensionState = ext.is_enabled_for_team
                        ? 'enabled'
                        : ext.state === 'enabled'
                            ? 'disabled'
                            : ext.state;
                    const config = stateConfig[displayState];

                    return (
                        <div className="space-y-1">
                            <Badge variant={config.variant}>{config.label}</Badge>
                            {row.original.error_message && (
                                <p className="max-w-[250px] text-xs text-destructive">
                                    {row.original.error_message}
                                </p>
                            )}
                        </div>
                    );
                },
            },
            {
                id: 'actions',
                cell: ({ row }) => {
                    const ext = row.original;

                    return (
                        <div className="flex items-center justify-end">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8"
                                            onClick={() => setDetailExtension(ext)}
                                        >
                                            <Eye className="h-4 w-4" />
                                            <span className="sr-only">{t('settings.extensions.details')}</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {t('settings.extensions.view_details_tooltip')}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <Guard permission="extension.manage">
                                {ext.state !== 'not_installed' &&
                                    ext.state !== 'errored' &&
                                    ext.state !== 'incompatible' && (
                                    <>
                                        {ext.is_enabled_for_team && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8"
                                                            onClick={() =>
                                                                postAction(
                                                                    disableUrl({
                                                                        current_team: teamSlug,
                                                                        extension: ext.id,
                                                                    }).url,
                                                                )
                                                            }
                                                        >
                                                            <PowerOff className="h-4 w-4" />
                                                            <span className="sr-only">{t('settings.extensions.disable')}</span>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {t('settings.extensions.disable')}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}

                                        {!ext.is_enabled_for_team && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8"
                                                            onClick={() =>
                                                                postAction(
                                                                    enableUrl({
                                                                        current_team: teamSlug,
                                                                        extension: ext.id,
                                                                    }).url,
                                                                )
                                                            }
                                                        >
                                                            <Power className="h-4 w-4" />
                                                            <span className="sr-only">{t('settings.extensions.enable')}</span>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {t('settings.extensions.enable')}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </>
                                )}

                                <DropdownMenu>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 text-muted-foreground data-[state=open]:bg-muted"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                        <span className="sr-only">{t('settings.extensions.more_actions_tooltip')}</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                {t('settings.extensions.more_actions_tooltip')}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <DropdownMenuContent align="end" className="w-40">
                                        {ext.state === 'not_installed' && (
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    postAction(
                                                        installUrl({
                                                            current_team: teamSlug,
                                                            extension: ext.id,
                                                        }).url,
                                                    )
                                                }
                                            >
                                                <Download className="h-4 w-4" />
                                                {t('settings.extensions.install')}
                                            </DropdownMenuItem>
                                        )}
                                        {ext.state !== 'not_installed' &&
                                            ext.state !== 'errored' &&
                                            ext.state !== 'incompatible' && (
                                            <DropdownMenuItem
                                                variant="destructive"
                                                onClick={() =>
                                                    postAction(
                                                        uninstallUrl({
                                                            current_team: teamSlug,
                                                            extension: ext.id,
                                                        }).url,
                                                    )
                                                }
                                            >
                                                <PackageX className="h-4 w-4" />
                                                {t('settings.extensions.uninstall')}
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </Guard>
                        </div>
                    );
                },
                enableHiding: false,
            },
        ],
        [teamSlug, postAction, t, stateConfig],
    );

    const table = useReactTable({
        data: filteredData,
        columns,
        state: {
            sorting,
            globalFilter,
            rowSelection,
            columnVisibility,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onRowSelectionChange: setRowSelection,
        onColumnVisibilityChange: setColumnVisibility,
        getRowId: (row) => row.id.toString(),
        enableRowSelection: true,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 10 } },
    });

    return (
        <TeamSettingsLayout
            activeTab="Extensions"
            wide
            breadcrumbs={[
                {
                    title: t('settings.extensions.title'),
                    href: extensionsUrl(teamSlug).url,
                },
            ]}
        >
            <Head title={t('settings.extensions.title')} />
            <h1 className="sr-only">{t('settings.extensions.title')}</h1>

            {extensions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Puzzle className="mb-4 h-12 w-12 opacity-20" />
                    <p className="text-sm">{t('settings.extensions.no_extensions')}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <Guard permission="extension.manage">
                                {table.getFilteredSelectedRowModel().rows.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const selected = table.getFilteredSelectedRowModel().rows;
                                                selected.forEach((row) => {
                                                    if (row.original.state !== 'not_installed' && !row.original.is_enabled_for_team) {
                                                        postAction(enableUrl({ current_team: teamSlug, extension: row.original.id }).url);
                                                    }
                                                });
                                                setRowSelection({});
                                            }}
                                        >
                                            <Power className="h-4 w-4" />
                                            {t('settings.extensions.enable')}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const selected = table.getFilteredSelectedRowModel().rows;
                                                selected.forEach((row) => {
                                                    if (row.original.state !== 'not_installed' && row.original.is_enabled_for_team) {
                                                        postAction(disableUrl({ current_team: teamSlug, extension: row.original.id }).url);
                                                    }
                                                });
                                                setRowSelection({});
                                            }}
                                        >
                                            <PowerOff className="h-4 w-4" />
                                            {t('settings.extensions.disable')}
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => {
                                                const selected = table.getFilteredSelectedRowModel().rows;
                                                selected.forEach((row) => {
                                                    if (row.original.state !== 'not_installed' && row.original.state !== 'errored' && row.original.state !== 'incompatible') {
                                                        postAction(uninstallUrl({ current_team: teamSlug, extension: row.original.id }).url);
                                                    }
                                                });
                                                setRowSelection({});
                                            }}
                                        >
                                            <PackageX className="h-4 w-4" />
                                            {t('settings.extensions.uninstall')}
                                        </Button>
                                        <Separator orientation="vertical" className="h-6" />
                                    </div>
                                )}
                            </Guard>
                            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as 'all' | 'module' | 'theme')}>
                                <SelectTrigger size="sm" className="h-9 w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('settings.extensions.filter_all')}</SelectItem>
                                    <SelectItem value="module">{t('settings.extensions.filter_modules')}</SelectItem>
                                    <SelectItem value="theme">{t('settings.extensions.filter_themes')}</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder={t('settings.extensions.search_placeholder')}
                                    value={globalFilter}
                                    onChange={(e) =>
                                        setGlobalFilter(e.target.value)
                                    }
                                    className="h-9 w-[200px] pl-9 lg:w-[260px]"
                                />
                            </div>
                            <DropdownMenu>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                    <Columns3 className="h-4 w-4" />
                                                    <span className="hidden lg:inline">
                                                        {t('settings.extensions.columns')}
                                                    </span>
                                                    <ChevronDown className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {t('settings.extensions.customize_tooltip')}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <DropdownMenuContent align="end" className="w-48">
                                    {table
                                        .getAllColumns()
                                        .filter(
                                            (column) =>
                                                typeof column.accessorFn !==
                                                    'undefined' &&
                                                column.getCanHide(),
                                        )
                                        .map((column) => (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                className="capitalize"
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) =>
                                                    column.toggleVisibility(
                                                        !!value,
                                                    )
                                                }
                                            >
                                                {column.id}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {filteredData.length > 0 && (
                    <div className="space-y-4">
                        <div className="rounded-lg border">
                            <Table>
                                <TableHeader>
                                    {table.getHeaderGroups().map(
                                        (headerGroup) => (
                                            <TableRow key={headerGroup.id}>
                                                {headerGroup.headers.map(
                                                    (header) => (
                                                        <TableHead
                                                            key={header.id}
                                                            colSpan={
                                                                header.colSpan
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
                                        ),
                                    )}
                                </TableHeader>
                                <TableBody>
                                    {table.getRowModel().rows.length > 0 ? (
                                        table
                                            .getRowModel()
                                            .rows.map((row) => (
                                                <TableRow
                                                    key={row.id}
                                                    data-state={
                                                        row.getIsSelected() &&
                                                        'selected'
                                                    }
                                                >
                                                    {row
                                                        .getVisibleCells()
                                                        .map((cell) => (
                                                            <TableCell
                                                                key={cell.id}
                                                            >
                                                                {flexRender(
                                                                    cell.column
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
                                                className="h-24 text-center text-muted-foreground"
                                            >
                                                {t('settings.extensions.no_results')}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex items-center justify-between px-1">
                            <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
                                {t('common.selected_rows', {
                                    selected: table.getFilteredSelectedRowModel().rows.length,
                                    total: table.getFilteredRowModel().rows.length,
                                })}
                            </div>
                            <div className="flex w-full items-center gap-8 lg:w-fit">
                                <div className="hidden items-center gap-2 lg:flex">
                                    <Label
                                        htmlFor="rows-per-page"
                                        className="text-sm font-medium"
                                    >
                                        {t('common.rows_per_page')}
                                    </Label>
                                    <Select
                                        value={`${table.getState().pagination.pageSize}`}
                                        onValueChange={(value) => {
                                            table.setPageSize(Number(value));
                                        }}
                                    >
                                        <SelectTrigger
                                            size="sm"
                                            className="w-20"
                                            id="rows-per-page"
                                        >
                                            <SelectValue
                                                placeholder={
                                                    table.getState().pagination
                                                        .pageSize
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent side="top">
                                            {[10, 20, 30, 40, 50].map(
                                                (pageSize) => (
                                                    <SelectItem
                                                        key={pageSize}
                                                        value={`${pageSize}`}
                                                    >
                                                        {pageSize}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex w-fit items-center justify-center text-sm font-medium">
                                    Page{' '}
                                    {table.getState().pagination.pageIndex + 1}{' '}
                                    of {table.getPageCount()}
                                </div>
                                <div className="ml-auto flex items-center gap-2 lg:ml-0">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="hidden size-8 lg:flex"
                                                    size="icon"
                                                    onClick={() =>
                                                        table.setPageIndex(0)
                                                    }
                                                    disabled={
                                                        !table.getCanPreviousPage()
                                                    }
                                                >
                                                    <ChevronsLeft className="h-4 w-4" />
                                                    <span className="sr-only">
                                                        First page
                                                    </span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                First page
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="size-8"
                                                    onClick={() =>
                                                        table.previousPage()
                                                    }
                                                    disabled={
                                                        !table.getCanPreviousPage()
                                                    }
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                    <span className="sr-only">
                                                        Previous page
                                                    </span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                Previous page
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="size-8"
                                                    onClick={() =>
                                                        table.nextPage()
                                                    }
                                                    disabled={
                                                        !table.getCanNextPage()
                                                    }
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                    <span className="sr-only">
                                                        Next page
                                                    </span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                Next page
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="hidden size-8 lg:flex"
                                                    size="icon"
                                                    onClick={() =>
                                                        table.setPageIndex(
                                                            table.getPageCount() -
                                                                1,
                                                        )
                                                    }
                                                    disabled={
                                                        !table.getCanNextPage()
                                                    }
                                                >
                                                    <ChevronsRight className="h-4 w-4" />
                                                    <span className="sr-only">
                                                        Last page
                                                    </span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                Last page
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>
                        </div>
                    </div>
                    )}
                </div>
            )}

            <Sheet open={!!detailExtension} onOpenChange={(open) => !open && setDetailExtension(null)}>
                <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
                    {detailExtension && (() => {
                        const ext = detailExtension;
                        const isModule = ext.type === 'module';

                        const descriptions: Record<string, { about: string; features: string[] }> = {
                            projects: {
                                about: t('settings.extensions.features.projects.about'),
                                features: [
                                    t('settings.extensions.features.projects.items.0'),
                                    t('settings.extensions.features.projects.items.1'),
                                    t('settings.extensions.features.projects.items.2'),
                                    t('settings.extensions.features.projects.items.3'),
                                ],
                            },
                            default: {
                                about: t('settings.extensions.features.default.about'),
                                features: [
                                    t('settings.extensions.features.default.items.0'),
                                    t('settings.extensions.features.default.items.1'),
                                    t('settings.extensions.features.default.items.2'),
                                    t('settings.extensions.features.default.items.3'),
                                ],
                            },
                        };

                        const meta = descriptions[ext.identifier] ?? {
                            about: ext.description,
                            features: [],
                        };

                        return (
                            <>
                                <SheetHeader>
                                    <SheetTitle>{ext.name}</SheetTitle>
                                    <SheetDescription>{ext.description}</SheetDescription>
                                </SheetHeader>

                                <div className="flex flex-col gap-6 px-4 pb-6">
                                    {/* About */}
                                    <div>
                                        <h4 className="text-sm font-semibold">
                                            {isModule ? t('settings.extensions.about_module') : t('settings.extensions.about_theme')}
                                        </h4>
                                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                            {meta.about}
                                        </p>
                                    </div>

                                    {/* Features */}
                                    {meta.features.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold">{t('settings.extensions.what_you_can_do')}</h4>
                                            <ul className="mt-2 space-y-1.5">
                                                {meta.features.map((f) => (
                                                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                                                        {f}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <Separator />

                                    {/* Info grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-lg border p-3">
                                            <p className="text-xs text-muted-foreground">{t('settings.extensions.type')}</p>
                                            <Badge variant="outline" className="mt-1 capitalize">
                                                {ext.type}
                                            </Badge>
                                        </div>
                                        <div className="rounded-lg border p-3">
                                            <p className="text-xs text-muted-foreground">{t('settings.extensions.version')}</p>
                                            <p className="mt-1 text-sm font-medium">v{ext.version}</p>
                                        </div>
                                        {ext.author && (
                                            <div className="rounded-lg border p-3">
                                                <p className="text-xs text-muted-foreground">{t('settings.extensions.author')}</p>
                                                <p className="mt-1 text-sm font-medium">{ext.author}</p>
                                            </div>
                                        )}
                                        {ext.license && (
                                            <div className="rounded-lg border p-3">
                                                <p className="text-xs text-muted-foreground">{t('settings.extensions.license')}</p>
                                                <p className="mt-1 text-sm font-medium">{ext.license}</p>
                                            </div>
                                        )}
                                        {ext.installed_at && (
                                            <div className="rounded-lg border p-3">
                                                <p className="text-xs text-muted-foreground">{t('settings.extensions.installed')}</p>
                                                <p className="mt-1 text-sm font-medium">
                                                    {new Date(ext.installed_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        )}
                                        {ext.lastarter_version && (
                                            <div className="rounded-lg border p-3">
                                                <p className="text-xs text-muted-foreground">{t('settings.extensions.requires')}</p>
                                                <p className="mt-1 text-sm font-medium">
                                                    {t('settings.extensions.requires_version', { version: ext.lastarter_version })}
                                                </p>
                                            </div>
                                        )}
                                        {ext.homepage && (
                                            <div className="rounded-lg border p-3 col-span-2">
                                                <p className="text-xs text-muted-foreground">{t('settings.extensions.homepage')}</p>
                                                <a
                                                    href={ext.homepage}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-1 block text-sm font-medium text-primary underline-offset-4 hover:underline"
                                                >
                                                    {ext.homepage}
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* Keywords */}
                                    {ext.keywords.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold">{t('settings.extensions.keywords')}</h4>
                                            <div className="mt-1.5 flex flex-wrap gap-1">
                                                {ext.keywords.map((kw) => (
                                                    <Badge key={kw} variant="secondary" className="text-xs">
                                                        {kw}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Permissions */}
                                    {isModule && ext.permissions.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold">
                                                {t('settings.extensions.permissions_title')} ({ext.permissions.length})
                                            </h4>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {t('settings.extensions.permissions_description')}
                                            </p>
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {ext.permissions.map((perm) => (
                                                    <code key={perm} className="rounded bg-muted px-1.5 py-0.5 text-xs">
                                                        {perm}
                                                    </code>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Settings */}
                                    {isModule && ext.settings.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold">
                                                {t('settings.extensions.settings_title')}
                                            </h4>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {t('settings.extensions.settings_description')}
                                            </p>
                                            <div className="mt-2 space-y-2">
                                                {ext.settings.map((s) => (
                                                    <div key={s.key} className="rounded-lg border p-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-medium">{s.label}</span>
                                                            <Badge variant="outline" className="text-xs">
                                                                {s.type}
                                                            </Badge>
                                                        </div>
                                                        {s.options && (
                                                            <div className="mt-1.5 flex flex-wrap gap-1">
                                                                {s.options.map((opt) => (
                                                                    <code
                                                                        key={opt.value}
                                                                        className={`rounded px-1.5 py-0.5 text-xs ${
                                                                            opt.value === s.default
                                                                                ? 'bg-primary/10 text-primary'
                                                                                : 'bg-muted'
                                                                        }`}
                                                                    >
                                                                        {opt.label}
                                                                        {opt.value === s.default && ` ${t('common.default')}`}
                                                                    </code>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {!s.options && s.default && (
                                                            <p className="mt-1 text-xs text-muted-foreground">
                                                                {t('settings.extensions.settings_default')} <code className="rounded bg-muted px-1">{s.default}</code>
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Technical info */}
                                    <Separator />
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t('settings.extensions.identifier')}</p>
                                        <code className="mt-1 block rounded bg-muted px-2 py-1 text-sm">
                                            {ext.identifier}
                                        </code>
                                    </div>

                                    {/* Error */}
                                    {ext.error_message && (
                                        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3">
                                            <p className="text-xs font-medium text-destructive">{t('settings.extensions.error_message')}</p>
                                            <p className="mt-1 text-sm text-destructive/80">
                                                {ext.error_message}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                </SheetContent>
            </Sheet>
        </TeamSettingsLayout>
    );
}
