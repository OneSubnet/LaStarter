import { Head, usePage } from '@inertiajs/react';
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
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Columns3,
    Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
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
import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { dashboard as accountingDashboard, reports as accountingReports } from '@/routes/ai/accounting';
import type { JournalEntryLine } from '@/types/ailes-invisibles';
import { formatCurrency } from '@/types/ailes-invisibles';

type Props = {
    entries: JournalEntryLine[];
    totalDebits: number;
    totalCredits: number;
    balance: number;
    startDate: string;
    endDate: string;
};

const fmt = formatCurrency;

export default function Reports({ entries, totalDebits, totalCredits, balance, startDate, endDate }: Props) {
    const { t } = useTranslation();
    const teamSlug = (usePage().props.currentTeam as { slug: string } | undefined)?.slug ?? '';
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [rowSelection, setRowSelection] = useState({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    const [filterFrom, setFilterFrom] = useState(startDate);
    const [filterTo, setFilterTo] = useState(endDate);

    const handleFilter = () => {
        router.get(
            accountingReports({ current_team: teamSlug }).url,
            { from: filterFrom, to: filterTo },
            { preserveState: true, preserveScroll: true },
        );
    };

    const columns = useMemo<ColumnDef<JournalEntryLine>[]>(
        () => [
            {
                accessorKey: 'date',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        {t('ai.accounting.date')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <span className="text-sm whitespace-nowrap">
                        {row.original.date ? new Date(row.original.date).toLocaleDateString() : '—'}
                    </span>
                ),
                enableHiding: false,
            },
            {
                accessorKey: 'description',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        {t('ai.accounting.description')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <span className="font-medium">{row.original.description ?? '-'}</span>
                ),
            },
            {
                accessorKey: 'account_name',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        {t('ai.accounting.account')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => <span className="font-medium">{row.original.account_name}</span>,
            },
            {
                accessorKey: 'debit',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        {t('ai.accounting.debit')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <span className="text-sm">
                        {row.original.debit > 0 ? fmt(row.original.debit) : '-'}
                    </span>
                ),
            },
            {
                accessorKey: 'credit',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        {t('ai.accounting.credit')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <span className="text-sm">
                        {row.original.credit > 0 ? fmt(row.original.credit) : '-'}
                    </span>
                ),
            },
            {
                id: 'reference',
                header: t('ai.accounting.reference'),
                cell: ({ row }) => (
                    <span className="text-sm text-muted-foreground">
                        {row.original.reference_type
                            ? row.original.reference_type.split('\\').pop() + ' #' + row.original.reference_id
                            : '-'}
                    </span>
                ),
            },
        ],
        [t],
    );

    const table = useReactTable({
        data: entries,
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
        getRowId: (_row, index) => index.toString(),
        enableRowSelection: true,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 20 } },
    });

    return (
        <AppLayout breadcrumbs={[{ title: t('ai.accounting.breadcrumb'), href: accountingDashboard({ current_team: teamSlug }).url }, { title: t('ai.accounting.reports') }]}>
            <Head title={t('ai.accounting.reports_title')} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">{t('ai.accounting.journal')}</p>
                    </div>
                </div>

                {/* Date Range Filter */}
                <div className="flex items-end gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="date-from">{t('ai.accounting.from')}</Label>
                        <Input
                            id="date-from"
                            type="date"
                            value={filterFrom}
                            onChange={(e) => setFilterFrom(e.target.value)}
                            className="w-44"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="date-to">{t('ai.accounting.to')}</Label>
                        <Input
                            id="date-to"
                            type="date"
                            value={filterTo}
                            onChange={(e) => setFilterTo(e.target.value)}
                            className="w-44"
                        />
                    </div>
                    <Button onClick={handleFilter}>
                        {t('ai.accounting.filter')}
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950/30">
                        <p className="text-xs text-muted-foreground">{t('ai.accounting.total_debits')}</p>
                        <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{fmt(totalDebits)}</p>
                    </div>
                    <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950/30">
                        <p className="text-xs text-muted-foreground">{t('ai.accounting.total_credits')}</p>
                        <p className="text-xl font-bold text-green-700 dark:text-green-400">{fmt(totalCredits)}</p>
                    </div>
                    <div className={`rounded-lg border p-4 ${Math.abs(balance) < 0.01 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
                        <p className="text-xs text-muted-foreground">{t('ai.accounting.balance_label')}</p>
                        <p className={`text-xl font-bold ${Math.abs(balance) < 0.01 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                            {fmt(balance)}
                        </p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder={t('ai.accounting.search_entries')}
                                value={globalFilter}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="h-9 w-[200px] pl-9 lg:w-[260px]"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <Columns3 className="h-4 w-4" />
                                                <span className="hidden lg:inline">{t('ai.accounting.columns')}</span>
                                                <ChevronDown className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>{t('ai.accounting.customize_columns')}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <DropdownMenuContent align="end" className="w-48">
                                {table
                                    .getAllColumns()
                                    .filter(
                                        (column) =>
                                            typeof column.accessorFn !== 'undefined' &&
                                            column.getCanHide(),
                                    )
                                    .map((column) => (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                        >
                                            {column.id === 'date'
                                                ? t('ai.accounting.date')
                                                : column.id === 'description'
                                                  ? t('ai.accounting.description')
                                                  : column.id === 'account_name'
                                                    ? t('ai.accounting.account')
                                                    : column.id === 'debit'
                                                      ? t('ai.accounting.debit')
                                                      : column.id === 'credit'
                                                        ? t('ai.accounting.credit')
                                                        : column.id === 'reference'
                                                          ? t('ai.accounting.reference')
                                                          : column.id}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id} colSpan={header.colSpan}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows.length > 0 ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                        {t('ai.accounting.no_entries_period')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-1">
                    <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
                        {table.getFilteredSelectedRowModel().rows.length} {t('ai.accounting.pagination_of')}{' '}
                        {table.getFilteredRowModel().rows.length} {t('ai.accounting.pagination_selected')}
                    </div>
                    <div className="flex w-full items-center gap-8 lg:w-fit">
                        <div className="hidden items-center gap-2 lg:flex">
                            <Label htmlFor="rows-per-page" className="text-sm font-medium">
                                {t('ai.accounting.rows_per_page')}
                            </Label>
                            <Select
                                value={`${table.getState().pagination.pageSize}`}
                                onValueChange={(value) => table.setPageSize(Number(value))}
                            >
                                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                                    <SelectValue placeholder={table.getState().pagination.pageSize} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {[10, 20, 30, 40, 50].map((pageSize) => (
                                        <SelectItem key={pageSize} value={`${pageSize}`}>
                                            {pageSize}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex w-fit items-center justify-center text-sm font-medium">
                            {t('ai.accounting.page')} {table.getState().pagination.pageIndex + 1} {t('ai.accounting.pagination_of')} {table.getPageCount()}
                        </div>
                        <div className="ml-auto flex items-center gap-2 lg:ml-0">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="hidden size-8 lg:flex"
                                            size="icon"
                                            onClick={() => table.setPageIndex(0)}
                                            disabled={!table.getCanPreviousPage()}
                                        >
                                            <ChevronsLeft className="h-4 w-4" />
                                            <span className="sr-only">{t('ai.accounting.first_page')}</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t('ai.accounting.first_page')}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="size-8"
                                            onClick={() => table.previousPage()}
                                            disabled={!table.getCanPreviousPage()}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            <span className="sr-only">{t('ai.accounting.previous')}</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t('ai.accounting.previous')}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="size-8"
                                            onClick={() => table.nextPage()}
                                            disabled={!table.getCanNextPage()}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                            <span className="sr-only">{t('ai.accounting.next')}</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t('ai.accounting.next')}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="hidden size-8 lg:flex"
                                            size="icon"
                                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                            disabled={!table.getCanNextPage()}
                                        >
                                            <ChevronsRight className="h-4 w-4" />
                                            <span className="sr-only">{t('ai.accounting.last_page')}</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t('ai.accounting.last_page')}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
