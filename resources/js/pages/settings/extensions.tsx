import { Head, router, usePage } from '@inertiajs/react';
import type {
    ColumnDef,
    SortingState,
    VisibilityState,
} from '@tanstack/react-table';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import {
    ArrowUpDown,
    ChevronDown,
    ChevronsLeft,
    ChevronsRight,
    ChevronLeft,
    ChevronRight,
    Columns3,
    Download,
    Eye,
    MoreVertical,
    PackageX,
    Power,
    PowerOff,
    Puzzle,
    RefreshCw,
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
import UninstallExtensionModal from '@/components/uninstall-extension-modal';
import TeamSettingsLayout from '@/layouts/team-settings-layout';
import { extensions as extensionsUrl } from '@/routes/settings/team';
import {
    batchDisable as batchDisableUrl,
    batchEnable as batchEnableUrl,
    checkUpdates as checkUpdatesUrl,
    disable as disableUrl,
    enable as enableUrl,
    install as installUrl,
    uninstall as uninstallUrl,
} from '@/routes/settings/team/extensions';
import type { SharedData } from '@/types';

type Extension = {
    id: number;
    identifier: string;
    name: string;
    type: 'module' | 'theme';
    version: string | null;
    description: string | null;
    author: string | null;
    state: 'installed' | 'enabled' | 'disabled' | 'errored' | null;
    is_enabled: boolean;
};

type Props = {
    extensions: Extension[];
};

function getDisplayState(ext: Extension): string {
    if (ext.is_enabled) {
        return 'enabled';
    }

    if (ext.state === 'enabled') {
        return 'disabled';
    }

    return ext.state ?? 'installed';
}

function ExtensionDetailPanel({
    extension: ext,
    stateConfig,
    teamSlug,
    onAction,
    onClose,
}: {
    extension: Extension;
    stateConfig: Record<
        string,
        {
            label: string;
            variant: 'default' | 'secondary' | 'destructive' | 'outline';
        }
    >;
    teamSlug: string;
    onAction: (url: string) => void;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const displayState = getDisplayState(ext);
    const config = stateConfig[displayState] ?? stateConfig.installed;

    const act = (url: string) => {
        onAction(url);
        onClose();
    };

    return (
        <>
            <SheetHeader>
                <SheetTitle>{ext.name}</SheetTitle>
                <SheetDescription>{ext.description}</SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-6 px-4 pb-6">
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">
                            {t('settings.extensions.type')}
                        </p>
                        <Badge variant="outline" className="mt-1 capitalize">
                            {ext.type}
                        </Badge>
                    </div>
                    <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">
                            {t('settings.extensions.table_status')}
                        </p>
                        <Badge variant={config.variant} className="mt-1">
                            {config.label}
                        </Badge>
                    </div>
                    <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">
                            {t('settings.extensions.version')}
                        </p>
                        <p className="mt-1 text-sm font-medium">
                            {ext.version ? `v${ext.version}` : '—'}
                        </p>
                    </div>
                    {ext.author ? (
                        <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">
                                {t('settings.extensions.author')}
                            </p>
                            <p className="mt-1 text-sm font-medium">
                                {ext.author}
                            </p>
                        </div>
                    ) : null}
                </div>

                <Separator />

                <div>
                    <p className="text-xs text-muted-foreground">
                        {t('settings.extensions.identifier')}
                    </p>
                    <code className="mt-1 block rounded bg-muted px-2 py-1 text-sm">
                        {ext.identifier}
                    </code>
                </div>

                <div className="flex gap-2">
                    <Guard permission="extension.manage">
                        {!ext.state ? (
                            <Button
                                size="sm"
                                onClick={() =>
                                    act(
                                        installUrl({
                                            current_team: teamSlug,
                                            extension: ext.identifier,
                                        }).url,
                                    )
                                }
                            >
                                <Download className="h-4 w-4" />
                                {t('settings.extensions.install')}
                            </Button>
                        ) : null}
                        {ext.state &&
                        !ext.is_enabled &&
                        ext.state !== 'errored' ? (
                            <Button
                                size="sm"
                                onClick={() =>
                                    act(
                                        enableUrl({
                                            current_team: teamSlug,
                                            extension: ext.identifier,
                                        }).url,
                                    )
                                }
                            >
                                <Power className="h-4 w-4" />
                                {t('settings.extensions.enable')}
                            </Button>
                        ) : null}
                        {ext.is_enabled ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    act(
                                        disableUrl({
                                            current_team: teamSlug,
                                            extension: ext.identifier,
                                        }).url,
                                    )
                                }
                            >
                                <PowerOff className="h-4 w-4" />
                                {t('settings.extensions.disable')}
                            </Button>
                        ) : null}
                        {ext.state && ext.state !== 'errored' ? (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                    act(
                                        uninstallUrl({
                                            current_team: teamSlug,
                                            extension: ext.identifier,
                                        }).url,
                                    )
                                }
                            >
                                <PackageX className="h-4 w-4" />
                                {t('settings.extensions.uninstall')}
                            </Button>
                        ) : null}
                    </Guard>
                </div>
            </div>
        </>
    );
}

export default function Extensions({ extensions }: Props) {
    const { t } = useTranslation();
    const { currentTeam } = usePage<SharedData>().props;
    const teamSlug = currentTeam?.slug;
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [rowSelection, setRowSelection] = useState({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {},
    );
    const [detailExtension, setDetailExtension] = useState<Extension | null>(
        null,
    );
    const [uninstallTarget, setUninstallTarget] = useState<Extension | null>(
        null,
    );
    const [typeFilter, setTypeFilter] = useState<'all' | 'module' | 'theme'>(
        'all',
    );

    const stateConfig = useMemo<
        Record<
            string,
            {
                label: string;
                variant: 'default' | 'secondary' | 'destructive' | 'outline';
            }
        >
    >(
        () => ({
            enabled: {
                label: t('settings.extensions.status_enabled'),
                variant: 'default',
            },
            disabled: {
                label: t('settings.extensions.status_disabled'),
                variant: 'secondary',
            },
            installed: {
                label: t('settings.extensions.status_installed'),
                variant: 'outline',
            },
            errored: {
                label: t('settings.extensions.status_error'),
                variant: 'destructive',
            },
        }),
        [t],
    );

    const filteredData = useMemo(() => {
        if (typeFilter === 'all') {
            return extensions;
        }

        return extensions.filter((ext) => ext.type === typeFilter);
    }, [extensions, typeFilter]);

    const columnLabels = useMemo<Record<string, string>>(
        () => ({
            type: t('settings.extensions.table_type'),
            author: t('settings.extensions.table_author'),
            version: t('settings.extensions.table_version'),
            state: t('settings.extensions.table_status'),
        }),
        [t],
    );

    const postAction = useCallback((url: string) => {
        router.post(url, {}, { preserveScroll: true });
    }, []);

    const columns = useMemo<ColumnDef<Extension>[]>(
        () => [
            {
                id: 'select',
                header: ({ table }) => (
                    <div className="flex items-center justify-center">
                        <Checkbox
                            checked={
                                table.getIsAllPageRowsSelected() ||
                                (table.getIsSomePageRowsSelected() &&
                                    'indeterminate')
                            }
                            onCheckedChange={(value) =>
                                table.toggleAllPageRowsSelected(!!value)
                            }
                            aria-label={t('a11y.select_all')}
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
                            aria-label={t('a11y.select_row')}
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
                    <span className="text-sm text-muted-foreground tabular-nums">
                        {row.original.version
                            ? `v${row.original.version}`
                            : '—'}
                    </span>
                ),
            },
            {
                accessorKey: 'state',
                header: t('settings.extensions.table_status'),
                cell: ({ row }) => {
                    const displayState = getDisplayState(row.original);
                    const config =
                        stateConfig[displayState] ?? stateConfig.installed;

                    return (
                        <Badge variant={config.variant}>{config.label}</Badge>
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
                                            onClick={() =>
                                                setDetailExtension(ext)
                                            }
                                        >
                                            <Eye className="h-4 w-4" />
                                            <span className="sr-only">
                                                {t(
                                                    'settings.extensions.details',
                                                )}
                                            </span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {t(
                                            'settings.extensions.view_details_tooltip',
                                        )}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <Guard permission="extension.manage">
                                {ext.state && ext.state !== 'errored' && (
                                    <>
                                        {ext.is_enabled && (
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
                                                                        current_team:
                                                                            teamSlug ??
                                                                            '',
                                                                        extension:
                                                                            ext.identifier,
                                                                    }).url,
                                                                )
                                                            }
                                                        >
                                                            <PowerOff className="h-4 w-4" />
                                                            <span className="sr-only">
                                                                {t(
                                                                    'settings.extensions.disable',
                                                                )}
                                                            </span>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {t(
                                                            'settings.extensions.disable',
                                                        )}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}

                                        {!ext.is_enabled &&
                                            ext.state !== null && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8"
                                                                onClick={() =>
                                                                    postAction(
                                                                        enableUrl(
                                                                            {
                                                                                current_team:
                                                                                    teamSlug ??
                                                                                    '',
                                                                                extension:
                                                                                    ext.identifier,
                                                                            },
                                                                        ).url,
                                                                    )
                                                                }
                                                            >
                                                                <Power className="h-4 w-4" />
                                                                <span className="sr-only">
                                                                    {t(
                                                                        'settings.extensions.enable',
                                                                    )}
                                                                </span>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            {t(
                                                                'settings.extensions.enable',
                                                            )}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                    </>
                                )}

                                {!ext.state && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8"
                                                    onClick={() =>
                                                        postAction(
                                                            installUrl({
                                                                current_team:
                                                                    teamSlug ??
                                                                    '',
                                                                extension:
                                                                    ext.identifier,
                                                            }).url,
                                                        )
                                                    }
                                                >
                                                    <Download className="h-4 w-4" />
                                                    <span className="sr-only">
                                                        {t(
                                                            'settings.extensions.install',
                                                        )}
                                                    </span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                {t(
                                                    'settings.extensions.install',
                                                )}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
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
                                                        <span className="sr-only">
                                                            {t(
                                                                'settings.extensions.more_actions_tooltip',
                                                            )}
                                                        </span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                {t(
                                                    'settings.extensions.more_actions_tooltip',
                                                )}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <DropdownMenuContent
                                        align="end"
                                        className="w-40"
                                    >
                                        {ext.state &&
                                            ext.state !== 'errored' && (
                                                <DropdownMenuItem
                                                    variant="destructive"
                                                    onClick={() =>
                                                        setUninstallTarget(ext)
                                                    }
                                                >
                                                    <PackageX className="h-4 w-4" />
                                                    {t(
                                                        'settings.extensions.uninstall',
                                                    )}
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
        state: { sorting, globalFilter, rowSelection, columnVisibility },
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
        <>
            <TeamSettingsLayout
                activeTab="Extensions"
                wide
                breadcrumbs={[
                    {
                        title: t('settings.extensions.title'),
                        href: extensionsUrl(teamSlug ?? '').url,
                    },
                ]}
            >
                <Head title={t('settings.extensions.title')} />
                <h1 className="sr-only">{t('settings.extensions.title')}</h1>

                {extensions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Puzzle className="mb-4 h-12 w-12 opacity-20" />
                        <p className="text-sm">
                            {t('settings.extensions.no_extensions')}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <Guard permission="extension.manage">
                                    {table.getFilteredSelectedRowModel().rows
                                        .length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const identifiers = table
                                                        .getFilteredSelectedRowModel()
                                                        .rows.filter(
                                                            (row) =>
                                                                row.original
                                                                    .state &&
                                                                !row.original
                                                                    .is_enabled,
                                                        )
                                                        .map(
                                                            (row) =>
                                                                row.original
                                                                    .identifier,
                                                        );

                                                    if (
                                                        identifiers.length > 0
                                                    ) {
                                                        router.post(
                                                            batchEnableUrl(
                                                                teamSlug ?? '',
                                                            ).url,
                                                            { identifiers },
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        );
                                                    }

                                                    setRowSelection({});
                                                }}
                                            >
                                                <Power className="h-4 w-4" />
                                                {t(
                                                    'settings.extensions.enable',
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const identifiers = table
                                                        .getFilteredSelectedRowModel()
                                                        .rows.filter(
                                                            (row) =>
                                                                row.original
                                                                    .is_enabled,
                                                        )
                                                        .map(
                                                            (row) =>
                                                                row.original
                                                                    .identifier,
                                                        );

                                                    if (
                                                        identifiers.length > 0
                                                    ) {
                                                        router.post(
                                                            batchDisableUrl(
                                                                teamSlug ?? '',
                                                            ).url,
                                                            { identifiers },
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        );
                                                    }

                                                    setRowSelection({});
                                                }}
                                            >
                                                <PowerOff className="h-4 w-4" />
                                                {t(
                                                    'settings.extensions.disable',
                                                )}
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => {
                                                    table
                                                        .getFilteredSelectedRowModel()
                                                        .rows.forEach((row) => {
                                                            if (
                                                                row.original
                                                                    .state &&
                                                                row.original
                                                                    .state !==
                                                                    'errored'
                                                            ) {
                                                                postAction(
                                                                    uninstallUrl(
                                                                        {
                                                                            current_team:
                                                                                teamSlug ??
                                                                                '',
                                                                            extension:
                                                                                row
                                                                                    .original
                                                                                    .identifier,
                                                                        },
                                                                    ).url,
                                                                );
                                                            }
                                                        });
                                                    setRowSelection({});
                                                }}
                                            >
                                                <PackageX className="h-4 w-4" />
                                                {t(
                                                    'settings.extensions.uninstall',
                                                )}
                                            </Button>
                                            <Separator
                                                orientation="vertical"
                                                className="h-6"
                                            />
                                        </div>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            postAction(
                                                checkUpdatesUrl({
                                                    current_team:
                                                        teamSlug ?? '',
                                                }).url,
                                            )
                                        }
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        {t('settings.extensions.check_updates')}
                                    </Button>
                                </Guard>
                                <Select
                                    value={typeFilter}
                                    onValueChange={(v) =>
                                        setTypeFilter(
                                            v as 'all' | 'module' | 'theme',
                                        )
                                    }
                                >
                                    <SelectTrigger
                                        size="sm"
                                        className="h-9 w-[140px]"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            {t(
                                                'settings.extensions.filter_all',
                                            )}
                                        </SelectItem>
                                        <SelectItem value="module">
                                            {t(
                                                'settings.extensions.filter_modules',
                                            )}
                                        </SelectItem>
                                        <SelectItem value="theme">
                                            {t(
                                                'settings.extensions.filter_themes',
                                            )}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder={t(
                                            'settings.extensions.search_placeholder',
                                        )}
                                        aria-label={t('a11y.search')}
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
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Columns3 className="h-4 w-4" />
                                                        <span className="hidden lg:inline">
                                                            {t(
                                                                'settings.extensions.columns',
                                                            )}
                                                        </span>
                                                        <ChevronDown className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                {t(
                                                    'settings.extensions.customize_tooltip',
                                                )}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <DropdownMenuContent
                                        align="end"
                                        className="w-48"
                                    >
                                        {table
                                            .getAllColumns()
                                            .filter(
                                                (col) =>
                                                    typeof col.accessorFn !==
                                                        'undefined' &&
                                                    col.getCanHide(),
                                            )
                                            .map((col) => (
                                                <DropdownMenuCheckboxItem
                                                    key={col.id}
                                                    className="capitalize"
                                                    checked={col.getIsVisible()}
                                                    onCheckedChange={(v) =>
                                                        col.toggleVisibility(
                                                            !!v,
                                                        )
                                                    }
                                                >
                                                    {columnLabels[col.id] ??
                                                        col.id}
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
                                            {table
                                                .getHeaderGroups()
                                                .map((hg) => (
                                                    <TableRow key={hg.id}>
                                                        {hg.headers.map(
                                                            (header) => (
                                                                <TableHead
                                                                    key={
                                                                        header.id
                                                                    }
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
                                                ))}
                                        </TableHeader>
                                        <TableBody>
                                            {table.getRowModel().rows.length >
                                            0 ? (
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
                                                        className="h-24 text-center text-muted-foreground"
                                                    >
                                                        {t(
                                                            'settings.extensions.no_results',
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="flex items-center justify-between px-1">
                                    <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
                                        {t('common.selected_rows', {
                                            selected:
                                                table.getFilteredSelectedRowModel()
                                                    .rows.length,
                                            total: table.getFilteredRowModel()
                                                .rows.length,
                                        })}
                                    </div>
                                    <div className="flex w-full items-center gap-8 lg:w-fit">
                                        <div className="hidden items-center gap-2 lg:flex">
                                            <Label
                                                htmlFor="ext-rows"
                                                className="text-sm font-medium"
                                            >
                                                {t('common.rows_per_page')}
                                            </Label>
                                            <Select
                                                value={`${table.getState().pagination.pageSize}`}
                                                onValueChange={(v) =>
                                                    table.setPageSize(Number(v))
                                                }
                                            >
                                                <SelectTrigger
                                                    size="sm"
                                                    className="w-20"
                                                    id="ext-rows"
                                                >
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent side="top">
                                                    {[10, 20, 30, 40, 50].map(
                                                        (ps) => (
                                                            <SelectItem
                                                                key={ps}
                                                                value={`${ps}`}
                                                            >
                                                                {ps}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex w-fit items-center justify-center text-sm font-medium">
                                            {t('common.page_of', {
                                                current:
                                                    table.getState().pagination
                                                        .pageIndex + 1,
                                                total: table.getPageCount(),
                                            })}
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
                                                                table.setPageIndex(
                                                                    0,
                                                                )
                                                            }
                                                            disabled={
                                                                !table.getCanPreviousPage()
                                                            }
                                                            aria-label={t(
                                                                'common.first_page',
                                                            )}
                                                        >
                                                            <ChevronsLeft className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {t('common.first_page')}
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
                                                            aria-label={t(
                                                                'common.previous',
                                                            )}
                                                        >
                                                            <ChevronLeft className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {t('common.previous')}
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
                                                            aria-label={t(
                                                                'common.next',
                                                            )}
                                                        >
                                                            <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {t('common.next')}
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
                                                            aria-label={t(
                                                                'common.last_page',
                                                            )}
                                                        >
                                                            <ChevronsRight className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {t('common.last_page')}
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

                <Sheet
                    open={!!detailExtension}
                    onOpenChange={(open) => !open && setDetailExtension(null)}
                >
                    <SheetContent
                        side="right"
                        className="overflow-y-auto sm:max-w-lg"
                    >
                        {detailExtension ? (
                            <ExtensionDetailPanel
                                extension={detailExtension}
                                stateConfig={stateConfig}
                                teamSlug={teamSlug ?? ''}
                                onAction={postAction}
                                onClose={() => setDetailExtension(null)}
                            />
                        ) : null}
                    </SheetContent>
                </Sheet>
            </TeamSettingsLayout>

            {uninstallTarget && (
                <UninstallExtensionModal
                    extension={{
                        identifier: uninstallTarget.identifier,
                        name: uninstallTarget.name,
                    }}
                    uninstallUrl={
                        uninstallUrl({
                            current_team: teamSlug ?? '',
                            extension: uninstallTarget.identifier,
                        }).url
                    }
                    open={!!uninstallTarget}
                    onOpenChange={(open) => {
                        if (!open) {
                            setUninstallTarget(null);
                        }
                    }}
                />
            )}
        </>
    );
}
