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
    ChevronsLeft,
    ChevronsRight,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Columns3,
    Inbox,
    Search,
} from 'lucide-react';
import type { ComponentType } from 'react';
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

export type DataTableProps<TData> = {
    columns: ColumnDef<TData, unknown>[];
    data: TData[];
    getRowId: (row: TData) => string;
    searchPlaceholder?: string;
    enableRowSelection?: boolean;
    defaultPageSize?: number;
    emptyMessage?: string;
    emptyIcon?: ComponentType<{ className?: string }>;
    toolbarSlot?: React.ReactNode;
    columnLabels?: Record<string, string>;
};

export default function DataTable<TData>({
    columns,
    data,
    getRowId,
    searchPlaceholder,
    enableRowSelection = false,
    defaultPageSize = 10,
    emptyMessage,
    emptyIcon: EmptyIcon = Inbox,
    toolbarSlot,
    columnLabels,
}: DataTableProps<TData>) {
    const { t } = useTranslation();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [rowSelection, setRowSelection] = useState({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    const table = useReactTable({
        data,
        columns,
        state: { sorting, globalFilter, rowSelection, columnVisibility },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onRowSelectionChange: setRowSelection,
        onColumnVisibilityChange: setColumnVisibility,
        getRowId,
        enableRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: defaultPageSize } },
    });

    const hiddenColumns = useMemo(
        () =>
            table.getAllColumns().filter(
                (col) => typeof col.accessorFn !== 'undefined' && col.getCanHide(),
            ),
        [table],
    );

    const resolveColumnLabel = (colId: string) =>
        columnLabels?.[colId] ?? colId;

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-1">
                <div>{toolbarSlot}</div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder={searchPlaceholder ?? t('common.search')}
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="h-9 w-[200px] pl-9 lg:w-[260px]"
                        />
                    </div>
                    {hiddenColumns.length > 0 && (
                        <DropdownMenu>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <Columns3 className="h-4 w-4" />
                                                <span className="hidden lg:inline">
                                                    {t('common.columns')}
                                                </span>
                                                <ChevronDown className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {t('common.customize_columns')}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <DropdownMenuContent align="end" className="w-48">
                                {hiddenColumns.map((col) => (
                                    <DropdownMenuCheckboxItem
                                        key={col.id}
                                        checked={col.getIsVisible()}
                                        onCheckedChange={(v) =>
                                            col.toggleVisibility(!!v)
                                        }
                                    >
                                        {resolveColumnLabel(col.id)}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((hg) => (
                            <TableRow key={hg.id}>
                                {hg.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        colSpan={header.colSpan}
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef.header,
                                                  header.getContext(),
                                              )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length > 0 ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={
                                        row.getIsSelected() && 'selected'
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
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
                                    <div className="flex flex-col items-center gap-2">
                                        <EmptyIcon className="h-8 w-8 text-muted-foreground/50" />
                                        {emptyMessage ?? t('common.no_results')}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-1">
                <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
                    {enableRowSelection &&
                        t('common.rows_selected', {
                            selected:
                                table.getFilteredSelectedRowModel().rows.length,
                            total: table.getFilteredRowModel().rows.length,
                        })}
                </div>
                <div className="flex w-full items-center gap-8 lg:w-fit">
                    <div className="hidden items-center gap-2 lg:flex">
                        <Label className="text-sm font-medium">
                            {t('common.rows_per_page')}
                        </Label>
                        <Select
                            value={`${table.getState().pagination.pageSize}`}
                            onValueChange={(v) =>
                                table.setPageSize(Number(v))
                            }
                        >
                            <SelectTrigger size="sm" className="w-20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[10, 20, 30, 40, 50].map((ps) => (
                                    <SelectItem key={ps} value={`${ps}`}>
                                        {ps}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex w-fit items-center justify-center text-sm font-medium">
                        {t('common.page_of', {
                            current: table.getState().pagination.pageIndex + 1,
                            total: Math.max(table.getPageCount(), 1),
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
                                        onClick={() => table.setPageIndex(0)}
                                        disabled={!table.getCanPreviousPage()}
                                    >
                                        <ChevronsLeft className="h-4 w-4" />
                                        <span className="sr-only">
                                            {t('common.first_page')}
                                        </span>
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
                                        onClick={() => table.previousPage()}
                                        disabled={!table.getCanPreviousPage()}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        <span className="sr-only">
                                            {t('common.previous')}
                                        </span>
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
                                        onClick={() => table.nextPage()}
                                        disabled={!table.getCanNextPage()}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                        <span className="sr-only">
                                            {t('common.next')}
                                        </span>
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
                                                table.getPageCount() - 1,
                                            )
                                        }
                                        disabled={!table.getCanNextPage()}
                                    >
                                        <ChevronsRight className="h-4 w-4" />
                                        <span className="sr-only">
                                            {t('common.last_page')}
                                        </span>
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
    );
}
