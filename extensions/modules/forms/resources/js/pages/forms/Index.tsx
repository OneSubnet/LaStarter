import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
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
    Eye,
    FileText,
    MessageSquare,
    MoreVertical,
    PlusCircle,
    Search,
    Trash2,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import Guard from '@/components/guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import * as formRoutes from '@/routes/forms';

type FormEntry = {
    id: number;
    title: string;
    description: string | null;
    slug: string;
    status: 'draft' | 'published' | 'closed';
    responses_count: number;
    created_at: string;
    creator: string | null;
};

type Props = { forms: FormEntry[] };

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    draft: { label: 'Draft', variant: 'outline' },
    published: { label: 'Published', variant: 'default' },
    closed: { label: 'Closed', variant: 'secondary' },
};

export default function FormIndex({ forms }: Props) {
    const page = usePage();
    const team = page.props.currentTeam as { slug: string } | null;
    const [open, setOpen] = useState(false);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [rowSelection, setRowSelection] = useState({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    const { data, setData, post, processing, reset } = useForm({
        title: '',
        description: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(formRoutes.store({ current_team: team?.slug ?? '' }).url, {
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    };

    const columns = useMemo<ColumnDef<FormEntry>[]>(
        () => [
            {
                id: 'select',
                header: ({ table }) => (
                    <div className="flex items-center justify-center">
                        <Checkbox
                            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
                            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                            aria-label="Select all"
                        />
                    </div>
                ),
                cell: ({ row }) => (
                    <div className="flex items-center justify-center">
                        <Checkbox
                            checked={row.getIsSelected()}
                            onCheckedChange={(value) => row.toggleSelected(!!value)}
                            aria-label="Select row"
                        />
                    </div>
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: 'title',
                header: ({ column }) => (
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                        Title
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="min-w-[200px]">
                        <div className="font-medium">{row.original.title}</div>
                        {row.original.description && (
                            <div className="max-w-[300px] truncate text-sm text-muted-foreground">
                                {row.original.description}
                            </div>
                        )}
                    </div>
                ),
                enableHiding: false,
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: ({ row }) => {
                    const config = statusConfig[row.original.status] ?? statusConfig.draft;
                    return <Badge variant={config.variant}>{config.label}</Badge>;
                },
            },
            {
                accessorKey: 'responses_count',
                header: ({ column }) => (
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                        Responses
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {row.original.responses_count}
                    </span>
                ),
            },
            {
                accessorKey: 'created_at',
                header: ({ column }) => (
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                        Created
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <span className="text-sm text-muted-foreground">
                        {new Date(row.original.created_at).toLocaleDateString()}
                    </span>
                ),
            },
            {
                accessorKey: 'creator',
                header: 'Created by',
                cell: ({ row }) => (
                    <span className="text-sm text-muted-foreground">
                        {row.original.creator ?? '—'}
                    </span>
                ),
            },
            {
                id: 'actions',
                cell: ({ row }) => {
                    const form = row.original;
                    return (
                        <div className="flex items-center justify-end">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="size-8" asChild>
                                            <Link href={formRoutes.show({ current_team: team?.slug ?? '', form: form.id }).url}>
                                                <Eye className="h-4 w-4" />
                                                <span className="sr-only">View</span>
                                            </Link>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>View form</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <Guard permission="form.delete">
                                <DropdownMenu>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground data-[state=open]:bg-muted">
                                                        <MoreVertical className="h-4 w-4" />
                                                        <span className="sr-only">More actions</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent>More actions</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <DropdownMenuContent align="end" className="w-40">
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={() => {
                                                if (confirm('Delete this form?')) {
                                                    router.delete(formRoutes.destroy({ current_team: team?.slug ?? '', form: form.id }).url, { preserveScroll: true });
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </Guard>
                        </div>
                    );
                },
                enableHiding: false,
            },
        ],
        [team?.slug],
    );

    const table = useReactTable({
        data: forms,
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
        <AppLayout
            breadcrumbs={[
                { title: 'Forms', href: formRoutes.index({ current_team: team?.slug ?? '' }).url },
            ]}
        >
            <Head title="Forms" />
            <h1 className="sr-only">Forms</h1>

            {forms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <FileText className="mb-4 h-12 w-12 opacity-20" />
                    <p className="text-sm">No forms yet. Create your first form to get started.</p>
                    <Guard permission="form.create">
                        <Button className="mt-4" onClick={() => setOpen(true)}>
                            <PlusCircle className="h-4 w-4" />
                            New Form
                        </Button>
                    </Guard>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search forms..."
                                    value={globalFilter}
                                    onChange={(e) => setGlobalFilter(e.target.value)}
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
                                                    <span className="hidden lg:inline">Columns</span>
                                                    <ChevronDown className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>Customize columns</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <DropdownMenuContent align="end" className="w-48">
                                    {table.getAllColumns()
                                        .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
                                        .map((column) => (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                className="capitalize"
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                            >
                                                {column.id}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <Guard permission="form.create">
                            <Button size="sm" onClick={() => setOpen(true)}>
                                <PlusCircle className="h-4 w-4" />
                                New Form
                            </Button>
                        </Guard>
                    </div>

                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead key={header.id} colSpan={header.colSpan}>
                                                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                                            No forms found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between px-1">
                        <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
                            {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
                        </div>
                        <div className="flex w-full items-center gap-8 lg:w-fit">
                            <div className="hidden items-center gap-2 lg:flex">
                                <Label htmlFor="rows-per-page" className="text-sm font-medium">Rows per page</Label>
                                <Select
                                    value={`${table.getState().pagination.pageSize}`}
                                    onValueChange={(value) => table.setPageSize(Number(value))}
                                >
                                    <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                                        <SelectValue placeholder={table.getState().pagination.pageSize} />
                                    </SelectTrigger>
                                    <SelectContent side="top">
                                        {[10, 20, 30, 40, 50].map((pageSize) => (
                                            <SelectItem key={pageSize} value={`${pageSize}`}>{pageSize}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex w-fit items-center justify-center text-sm font-medium">
                                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                            </div>
                            <div className="ml-auto flex items-center gap-2 lg:ml-0">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" className="hidden size-8 lg:flex" size="icon" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                                                <ChevronsLeft className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>First page</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="icon" className="size-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Previous page</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="icon" className="size-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Next page</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" className="hidden size-8 lg:flex" size="icon" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
                                                <ChevronsRight className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Last page</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Form</DialogTitle>
                        <DialogDescription>Create a new form for your team.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} rows={3} />
                        </div>
                        <Button type="submit" disabled={processing}>Create</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
