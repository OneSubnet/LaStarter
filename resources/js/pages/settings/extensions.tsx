import { Head, router, usePage } from '@inertiajs/react';
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

const stateConfig: Record<
    ExtensionState,
    { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
    enabled: { label: 'Active', variant: 'default' },
    disabled: { label: 'Disabled', variant: 'secondary' },
    not_installed: { label: 'Not Installed', variant: 'outline' },
    errored: { label: 'Error', variant: 'destructive' },
    incompatible: { label: 'Incompatible', variant: 'destructive' },
};

export default function Extensions({ extensions }: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = (currentTeam as { slug: string } | null)?.slug ?? '';
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [rowSelection, setRowSelection] = useState({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [detailExtension, setDetailExtension] = useState<Extension | null>(null);

    const filteredData = useMemo(() => extensions, [extensions]);

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
                        Name
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
                header: 'Type',
                cell: ({ row }) => (
                    <Badge variant="outline" className="capitalize">
                        {row.original.type}
                    </Badge>
                ),
            },
            {
                accessorKey: 'author',
                header: 'Author',
                cell: ({ row }) => (
                    <span className="text-sm text-muted-foreground">
                        {row.original.author ?? '—'}
                    </span>
                ),
            },
            {
                accessorKey: 'version',
                header: 'Version',
                cell: ({ row }) => (
                    <span className="text-sm tabular-nums text-muted-foreground">
                        v{row.original.version}
                    </span>
                ),
            },
            {
                accessorKey: 'state',
                header: 'Status',
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
                                            <span className="sr-only">Details</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        View details
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
                                                            <span className="sr-only">Disable</span>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        Disable
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
                                                            <span className="sr-only">Enable</span>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        Enable
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
                                                        <span className="sr-only">More actions</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                More actions
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
                                                Install
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
                                                Uninstall
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
        [teamSlug, postAction],
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
                    title: 'Extensions',
                    href: extensionsUrl(teamSlug).url,
                },
            ]}
        >
            <Head title="Extensions" />
            <h1 className="sr-only">Extensions</h1>

            {extensions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Puzzle className="mb-4 h-12 w-12 opacity-20" />
                    <p className="text-sm">No extensions available.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search extensions..."
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
                                                        Columns
                                                    </span>
                                                    <ChevronDown className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Customize columns
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
                                                No extensions found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex items-center justify-between px-1">
                            <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
                                {table.getFilteredSelectedRowModel().rows.length}{' '}
                                of{' '}
                                {table.getFilteredRowModel().rows.length}{' '}
                                row(s) selected.
                            </div>
                            <div className="flex w-full items-center gap-8 lg:w-fit">
                                <div className="hidden items-center gap-2 lg:flex">
                                    <Label
                                        htmlFor="rows-per-page"
                                        className="text-sm font-medium"
                                    >
                                        Rows per page
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
                                about: 'Full project management for your team. Create, organize and track projects with customizable visibility settings. Each project is scoped to your team so data stays isolated.',
                                features: [
                                    'Create and manage team projects',
                                    'Customizable default visibility (private, team, public)',
                                    'Project listing with search and filters',
                                    'Full CRUD operations with permission controls',
                                ],
                            },
                            tasks: {
                                about: 'Lightweight task management with project linking. Create tasks, assign statuses, and keep your team on track. Tasks can be linked to projects from the Projects module.',
                                features: [
                                    'Create and assign tasks to team members',
                                    'Track task status (To Do, In Progress, Done)',
                                    'Link tasks to projects',
                                    'Configurable default task status',
                                ],
                            },
                            default: {
                                about: 'The default LaStarter theme. Provides a clean, modern dashboard and consistent UI components across the platform. This theme can be overridden by installing a custom theme.',
                                features: [
                                    'Clean dashboard layout',
                                    'Consistent UI component styling',
                                    'Responsive design for all screen sizes',
                                    'Dark mode support',
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
                                            {isModule ? 'About this module' : 'About this theme'}
                                        </h4>
                                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                            {meta.about}
                                        </p>
                                    </div>

                                    {/* Features */}
                                    {meta.features.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold">What you can do</h4>
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
                                            <p className="text-xs text-muted-foreground">Type</p>
                                            <Badge variant="outline" className="mt-1 capitalize">
                                                {ext.type}
                                            </Badge>
                                        </div>
                                        <div className="rounded-lg border p-3">
                                            <p className="text-xs text-muted-foreground">Version</p>
                                            <p className="mt-1 text-sm font-medium">v{ext.version}</p>
                                        </div>
                                        {ext.author && (
                                            <div className="rounded-lg border p-3">
                                                <p className="text-xs text-muted-foreground">Author</p>
                                                <p className="mt-1 text-sm font-medium">{ext.author}</p>
                                            </div>
                                        )}
                                        {ext.license && (
                                            <div className="rounded-lg border p-3">
                                                <p className="text-xs text-muted-foreground">License</p>
                                                <p className="mt-1 text-sm font-medium">{ext.license}</p>
                                            </div>
                                        )}
                                        {ext.installed_at && (
                                            <div className="rounded-lg border p-3">
                                                <p className="text-xs text-muted-foreground">Installed</p>
                                                <p className="mt-1 text-sm font-medium">
                                                    {new Date(ext.installed_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        )}
                                        {ext.lastarter_version && (
                                            <div className="rounded-lg border p-3">
                                                <p className="text-xs text-muted-foreground">Requires</p>
                                                <p className="mt-1 text-sm font-medium">
                                                    LaStarter {ext.lastarter_version}
                                                </p>
                                            </div>
                                        )}
                                        {ext.homepage && (
                                            <div className="rounded-lg border p-3 col-span-2">
                                                <p className="text-xs text-muted-foreground">Homepage</p>
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
                                            <h4 className="text-sm font-semibold">Keywords</h4>
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
                                                Permissions ({ext.permissions.length})
                                            </h4>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                These permissions are added when the module is enabled. Assign them to roles to control access.
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
                                                Configurable settings
                                            </h4>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                These settings can be adjusted per team when the module is active.
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
                                                                        {opt.value === s.default && ' (default)'}
                                                                    </code>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {!s.options && s.default && (
                                                            <p className="mt-1 text-xs text-muted-foreground">
                                                                Default: <code className="rounded bg-muted px-1">{s.default}</code>
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
                                        <p className="text-xs text-muted-foreground">Identifier</p>
                                        <code className="mt-1 block rounded bg-muted px-2 py-1 text-sm">
                                            {ext.identifier}
                                        </code>
                                    </div>

                                    {/* Error */}
                                    {ext.error_message && (
                                        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3">
                                            <p className="text-xs font-medium text-destructive">Error</p>
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
