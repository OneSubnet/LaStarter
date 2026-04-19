import { Head, router } from '@inertiajs/react';
import { useForm } from '@tanstack/react-form';
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
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Columns3,
    Eye,
    Plus,
    Search,
    Shield,
    Trash2,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import Guard from '@/components/guard';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { zodValidator } from '@/lib/inertia-form';
import { roleNameSchema } from '@/lib/schemas';
import { cn } from '@/lib/utils';
import { roles as rolesUrl } from '@/routes/settings/team';
import {
    store as storeUrl,
    update as updateUrl,
    destroy as destroyUrl,
} from '@/routes/settings/team/roles';

type Role = {
    id: number;
    name: string;
    is_protected: boolean;
    permissions: string[];
    users_count: number;
};

type Props = {
    team: {
        id: number;
        name: string;
        slug: string;
    };
    roles: Role[];
    allPermissions: Record<string, { name: string; module: string }[]>;
};

function PermissionCategory({
    category,
    permissions,
    selected,
    onToggle,
    onToggleAll,
}: {
    category: string;
    permissions: { name: string; module: string }[];
    selected: string[];
    onToggle: (perm: string) => void;
    onToggleAll: () => void;
}) {
    const allSelected = permissions.every((p) => selected.includes(p.name));

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium capitalize">{category}</h4>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={onToggleAll}
                >
                    {allSelected ? 'Remove all' : 'Select all'}
                </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {permissions.map((permission) => {
                    const isSelected = selected.includes(permission.name);
                    const shortName = permission.name.split('.')[1];

                    return (
                        <button
                            key={permission.name}
                            type="button"
                            onClick={() => onToggle(permission.name)}
                            className={cn(
                                'inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                                isSelected
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border hover:border-foreground/30',
                            )}
                        >
                            {isSelected && <Check className="h-3 w-3" />}
                            {shortName}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default function TeamRoles({ team, roles, allPermissions }: Props) {
    const teamSlug = team.slug;

    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [rowSelection, setRowSelection] = useState({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    const [detailRole, setDetailRole] = useState<Role | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    const [editName, setEditName] = useState('');
    const [editPermissions, setEditPermissions] = useState<string[]>([]);
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});

    const createForm = useForm({
        defaultValues: { name: '' },
        validators: { onChange: zodValidator(roleNameSchema) },
        onSubmit: ({ value }) => {
            router.post(
                storeUrl(teamSlug).url,
                { ...value, permissions: [] },
                {
                    preserveScroll: true,
                    onSuccess: (page) => {
                        setCreateDialogOpen(false);
                        createForm.reset();

                        const flash = (page as unknown as { props: { roles: Role[] } }).props?.roles;
                        if (flash && flash.length > 0) {
                            const newRole = flash[flash.length - 1];
                            openDetail(newRole);
                        }
                    },
                },
            );
        },
    });

    const openDetail = useCallback((role: Role) => {
        setDetailRole(role);
        setEditName(role.name);
        setEditPermissions([...role.permissions]);
        setEditErrors({});
    }, []);

    const closeDetail = useCallback(() => {
        setDetailRole(null);
        setEditName('');
        setEditPermissions([]);
        setEditErrors({});
    }, []);

    const handleUpdate = () => {
        if (!detailRole || detailRole.is_protected) return;

        setEditErrors({});
        router.patch(
            updateUrl({ current_team: teamSlug, role: detailRole.id }).url,
            { name: editName, permissions: editPermissions },
            {
                preserveScroll: true,
                onError: (errors) => setEditErrors(errors),
            },
        );
    };

    const handleDelete = (roleId: number) => {
        router.delete(
            destroyUrl({ current_team: teamSlug, role: roleId }).url,
            {
                onSuccess: () => {
                    if (detailRole?.id === roleId) closeDetail();
                    setDeleteConfirmId(null);
                },
            },
        );
    };

    const togglePermission = (perm: string) => {
        setEditPermissions((prev) =>
            prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
        );
    };

    const toggleCategory = (category: string) => {
        const categoryPerms = (allPermissions[category] ?? []).map((p) => p.name);
        const allSelected = categoryPerms.every((p) => editPermissions.includes(p));

        if (allSelected) {
            setEditPermissions((prev) => prev.filter((p) => !categoryPerms.includes(p)));
        } else {
            setEditPermissions((prev) => [...new Set([...prev, ...categoryPerms])]);
        }
    };

    const toggleAll = () => {
        const allPerms = Object.values(allPermissions).flat().map((p) => p.name);
        if (allPerms.every((p) => editPermissions.includes(p))) {
            setEditPermissions([]);
        } else {
            setEditPermissions(allPerms);
        }
    };

    const columns = useMemo<ColumnDef<Role>[]>(
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
                    <div className="flex items-center gap-2">
                        {row.original.is_protected && (
                            <Shield className="h-4 w-4 shrink-0 text-amber-500" />
                        )}
                        <span className="font-medium">{row.original.name}</span>
                    </div>
                ),
                enableHiding: false,
            },
            {
                accessorKey: 'users_count',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === 'asc')
                        }
                    >
                        Members
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <span className="text-sm text-muted-foreground">
                        {row.original.users_count} member{row.original.users_count !== 1 ? 's' : ''}
                    </span>
                ),
            },
            {
                id: 'permissions_count',
                header: 'Permissions',
                cell: ({ row }) => (
                    <Badge variant="secondary">
                        {row.original.permissions.length}
                    </Badge>
                ),
            },
            {
                accessorKey: 'is_protected',
                header: 'Status',
                cell: ({ row }) => {
                    if (row.original.is_protected) {
                        return <Badge variant="outline">System</Badge>;
                    }
                    return <Badge variant="secondary">Custom</Badge>;
                },
            },
            {
                id: 'actions',
                cell: ({ row }) => {
                    const role = row.original;

                    return (
                        <div className="flex items-center justify-end">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8"
                                            onClick={() => openDetail(role)}
                                        >
                                            <Eye className="h-4 w-4" />
                                            <span className="sr-only">View details</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        View details
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <Guard permission="role.delete">
                                {!role.is_protected && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() => setDeleteConfirmId(role.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Delete role</span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                Delete role
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </Guard>
                        </div>
                    );
                },
                enableHiding: false,
            },
        ],
        [openDetail],
    );

    const table = useReactTable({
        data: roles,
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
            activeTab="Roles"
            wide
            breadcrumbs={[
                { title: team.name, href: rolesUrl(teamSlug).url },
                { title: 'Roles & Permissions', href: '#' },
            ]}
        >
            <Head title={`Roles & Permissions - ${team.name}`} />

            {roles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Shield className="mb-4 h-12 w-12 opacity-20" />
                    <p className="text-sm">No roles found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <Guard permission="role.create">
                            <Button
                                size="sm"
                                onClick={() => {
                                    createForm.reset();
                                    setCreateDialogOpen(true);
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Create role
                            </Button>
                        </Guard>

                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search roles..."
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
                                                {column.id === 'users_count'
                                                    ? 'Members'
                                                    : column.id === 'permissions_count'
                                                      ? 'Permissions'
                                                      : column.id === 'is_protected'
                                                        ? 'Status'
                                                        : column.id}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead
                                                key={header.id}
                                                colSpan={header.colSpan}
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column
                                                              .columnDef
                                                              .header,
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
                                            No roles found.
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

            {/* Role Detail Sheet */}
            <Sheet open={!!detailRole} onOpenChange={(open) => !open && closeDetail()}>
                <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
                    {detailRole && (() => {
                        const role = detailRole;

                        return (
                            <>
                                <SheetHeader>
                                    <div className="flex items-center gap-2">
                                        {role.is_protected && (
                                            <Shield className="h-5 w-5 text-amber-500" />
                                        )}
                                        <SheetTitle>{role.name}</SheetTitle>
                                    </div>
                                    <SheetDescription>
                                        {role.is_protected
                                            ? 'This is a protected system role. It cannot be modified.'
                                            : 'Edit role name and manage permissions.'}
                                    </SheetDescription>
                                </SheetHeader>

                                <div className="flex flex-col gap-6 px-4 pb-6">
                                    {/* Members count */}
                                    <div className="rounded-lg border p-3">
                                        <p className="text-xs text-muted-foreground">Members</p>
                                        <p className="mt-1 text-sm font-medium">
                                            {role.users_count} member{role.users_count !== 1 ? 's' : ''}
                                        </p>
                                    </div>

                                    {!role.is_protected ? (
                                        <Guard permission="role.update">
                                            <div className="space-y-6">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="edit-role-name">Role name</Label>
                                                    <Input
                                                        id="edit-role-name"
                                                        value={editName}
                                                        onChange={(e) =>
                                                            setEditName(e.target.value)
                                                        }
                                                    />
                                                    <InputError
                                                        message={editErrors.name}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label>
                                                            Permissions ({editPermissions.length})
                                                        </Label>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 text-xs"
                                                            onClick={toggleAll}
                                                        >
                                                            Toggle all
                                                        </Button>
                                                    </div>
                                                    <div className="space-y-4">
                                                        {Object.entries(allPermissions).map(
                                                            ([category, perms]) => (
                                                                <PermissionCategory
                                                                    key={category}
                                                                    category={category}
                                                                    permissions={perms}
                                                                    selected={editPermissions}
                                                                    onToggle={togglePermission}
                                                                    onToggleAll={() =>
                                                                        toggleCategory(category)
                                                                    }
                                                                />
                                                            ),
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex justify-end">
                                                    <Button onClick={handleUpdate}>
                                                        Save changes
                                                    </Button>
                                                </div>
                                            </div>
                                        </Guard>
                                    ) : (
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-sm font-semibold">
                                                    Permissions summary
                                                </h4>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    This role has all permissions and cannot be modified.
                                                </p>
                                            </div>
                                            {Object.entries(allPermissions).map(
                                                ([category, perms]) => (
                                                    <div
                                                        key={category}
                                                        className="flex items-center justify-between rounded-md border px-4 py-3"
                                                    >
                                                        <span className="font-medium capitalize">
                                                            {category}
                                                        </span>
                                                        <span className="text-sm text-muted-foreground">
                                                            {perms.length} permission{perms.length !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                </SheetContent>
            </Sheet>

            {/* Create Role Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create new role</DialogTitle>
                    </DialogHeader>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            createForm.handleSubmit();
                        }}
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="create-role-name">Role name</Label>
                            <createForm.Field name="name">
                                {(field) => (
                                    <>
                                        <Input
                                            id="create-role-name"
                                            value={field.state.value}
                                            onChange={(e) =>
                                                field.handleChange(e.target.value)
                                            }
                                            onBlur={field.handleBlur}
                                            placeholder="e.g. Manager, Tech Lead"
                                            autoFocus
                                        />
                                        <InputError
                                            message={
                                                field.state.meta.errors?.[0] as
                                                    | string
                                                    | undefined
                                            }
                                        />
                                    </>
                                )}
                            </createForm.Field>
                        </div>

                        <DialogFooter className="mt-4">
                            <Button
                                variant="outline"
                                onClick={() => setCreateDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <createForm.Subscribe
                                selector={(state) => [state.canSubmit, state.isSubmitting]}
                            >
                                {([canSubmit, isSubmitting]) => (
                                    <Button
                                        type="submit"
                                        disabled={!canSubmit || isSubmitting}
                                    >
                                        {isSubmitting
                                            ? 'Creating...'
                                            : 'Create role'}
                                    </Button>
                                )}
                            </createForm.Subscribe>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog
                open={deleteConfirmId !== null}
                onOpenChange={() => setDeleteConfirmId(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete role</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Are you sure you want to delete this role? Members with
                        this role will lose its permissions. This cannot be
                        undone.
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteConfirmId(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (deleteConfirmId) handleDelete(deleteConfirmId);
                            }}
                        >
                            Delete role
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </TeamSettingsLayout>
    );
}
