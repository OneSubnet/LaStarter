import { Head, router } from '@inertiajs/react';
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
    ChevronsLeft,
    ChevronsRight,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Columns3,
    Clock,
    Mail,
    Search,
    ShieldCheck,
    Trash2,
    UserPlus,
    X,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/lib/format';
import CancelInvitationModal from '@/components/cancel-invitation-modal';
import Guard from '@/components/guard';
import InviteMemberModal from '@/components/invite-member-modal';
import RemoveMemberModal from '@/components/remove-member-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { useInitials } from '@/hooks/use-initials';
import TeamSettingsLayout from '@/layouts/team-settings-layout';
import { members as membersUrl } from '@/routes/settings/team';
import { update as updateMember } from '@/routes/settings/team/members';
import type {
    RoleOption,
    Team,
    TeamInvitation,
    TeamMember,
} from '@/types';

type Props = {
    team: Team;
    members: TeamMember[];
    invitations: TeamInvitation[];
    permissions: string[];
    availableRoles: RoleOption[];
};

export default function TeamMembers({
    team,
    members,
    invitations,
    permissions,
    availableRoles,
}: Props) {
    const { t } = useTranslation();
    const getInitials = useInitials();

    const statusConfig = useMemo<Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }>>(() => ({
        active: { label: t('common.active'), variant: 'default' },
        invited: { label: t('common.invited'), variant: 'outline' },
        suspended: { label: t('common.suspended'), variant: 'destructive' },
    }), [t]);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
    const [cancelInvitationDialogOpen, setCancelInvitationDialogOpen] = useState(false);
    const [invitationToCancel, setInvitationToCancel] = useState<TeamInvitation | null>(null);

    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [rowSelection, setRowSelection] = useState({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    const can = (permission: string) => permissions.includes(permission);

    const updateMemberRole = useCallback(
        (member: TeamMember, newRole: string) => {
            router.visit(
                updateMember({ current_team: team.slug, user: member.id }).url,
                {
                    data: { role: newRole },
                    method: 'patch',
                    preserveScroll: true,
                },
            );
        },
        [team.slug],
    );

    const columns = useMemo<ColumnDef<TeamMember>[]>(
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
                        {t('settings.team.members.table_member')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="flex items-center gap-3 min-w-[200px]">
                        <Avatar className="h-8 w-8">
                            {row.original.avatar ? (
                                <AvatarImage
                                    src={row.original.avatar}
                                    alt={row.original.name}
                                />
                            ) : null}
                            <AvatarFallback className="text-xs">
                                {getInitials(row.original.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-medium">{row.original.name}</div>
                            <div className="text-xs text-muted-foreground">
                                {row.original.email}
                            </div>
                        </div>
                    </div>
                ),
                enableHiding: false,
            },
            {
                accessorKey: 'role',
                header: t('settings.team.members.table_role'),
                cell: ({ row }) => {
                    const member = row.original;

                    if (member.role !== 'owner' && can('member.update')) {
                        return (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        data-test="member-role-trigger"
                                    >
                                        {member.role_label}
                                        <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    {availableRoles.map((role) => (
                                        <DropdownMenuItem
                                            key={role.value}
                                            data-test="member-role-option"
                                            onSelect={() =>
                                                updateMemberRole(member, role.value)
                                            }
                                        >
                                            {role.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        );
                    }

                    return (
                        <Badge variant="secondary">
                            <ShieldCheck className="h-3 w-3" />
                            {member.role_label}
                        </Badge>
                    );
                },
            },
            {
                accessorKey: 'status',
                header: t('settings.team.members.table_status'),
                cell: ({ row }) => {
                    const status = row.original.status;
                    const config = statusConfig[status] ?? {
                        label: status,
                        variant: 'outline' as const,
                    };

                    return <Badge variant={config.variant}>{config.label}</Badge>;
                },
            },
            {
                accessorKey: 'joined_at',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === 'asc')
                        }
                    >
                        {t('settings.team.members.table_joined')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => {
                    const date = row.original.joined_at;

                    if (!date) {
                        return <span className="text-muted-foreground">—</span>;
                    }

                    return (
                        <span className="text-sm text-muted-foreground">
                            {formatDate(date, {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                            })}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'roles',
                header: t('settings.team.members.table_permissions'),
                cell: ({ row }) => {
                    const roles = row.original.roles ?? [];

                    if (roles.length === 0) {
                        return <span className="text-muted-foreground text-sm">—</span>;
                    }

                    return (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {roles.slice(0, 3).map((r) => (
                                <code
                                    key={r}
                                    className="rounded bg-muted px-1.5 py-0.5 text-xs"
                                >
                                    {r}
                                </code>
                            ))}
                            {roles.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                    +{roles.length - 3}
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                id: 'actions',
                cell: ({ row }) => {
                    const member = row.original;

                    return (
                        <div className="flex items-center justify-end">
                            {member.role !== 'owner' && can('member.remove') && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-muted-foreground hover:text-destructive"
                                                data-test="member-remove-button"
                                                onClick={() => {
                                                    setMemberToRemove(member);
                                                    setRemoveMemberDialogOpen(true);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">{t('common.delete')}</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{t('settings.team.members.cancel_invitation')}</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    );
                },
                enableHiding: false,
            },
        ],
        [availableRoles, updateMemberRole, getInitials, permissions, can, t, statusConfig],
    );

    const table = useReactTable({
        data: members,
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
        <TeamSettingsLayout
            activeTab="Members"
            breadcrumbs={[
                {
                    title: team.name,
                    href: membersUrl(team.slug).url,
                },
            ]}
        >
            <Head title={`${t('common.members')} - ${team.name}`} />
            <h1 className="sr-only">{t('common.members')}</h1>

            <div className="flex flex-col space-y-10">
                {/* Members DataTable */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <Guard permission="invitation.create">
                            <Button
                                size="sm"
                                data-test="invite-member-button"
                                onClick={() => setInviteDialogOpen(true)}
                            >
                                <UserPlus className="h-4 w-4" />
                                {t('settings.team.members.invite_button')}
                            </Button>
                        </Guard>

                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder={t('settings.team.members.search_placeholder')}
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
                                                    <span className="hidden lg:inline">{t('settings.team.members.columns')}</span>
                                                    <ChevronDown className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>{t('settings.team.members.customize_tooltip')}</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <DropdownMenuContent align="end" className="w-48">
                                    {table
                                        .getAllColumns()
                                        .filter(
                                            (col) =>
                                                typeof col.accessorFn !== 'undefined' &&
                                                col.getCanHide(),
                                        )
                                        .map((col) => (
                                            <DropdownMenuCheckboxItem
                                                key={col.id}
                                                className="capitalize"
                                                checked={col.getIsVisible()}
                                                onCheckedChange={(v) =>
                                                    col.toggleVisibility(!!v)
                                                }
                                            >
                                                {col.id === 'role'
                                                    ? t('settings.team.members.table_role')
                                                    : col.id === 'status'
                                                      ? t('settings.team.members.table_status')
                                                      : col.id === 'joined_at'
                                                        ? t('settings.team.members.table_joined')
                                                        : col.id === 'roles'
                                                          ? t('settings.team.members.table_permissions')
                                                          : col.id}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

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
                                            {t('settings.team.members.no_members')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-1">
                        <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
                            {t('settings.team.members.selected_rows', {
                                selected: table.getFilteredSelectedRowModel().rows.length,
                                total: table.getFilteredRowModel().rows.length,
                            })}
                        </div>
                        <div className="flex w-full items-center gap-8 lg:w-fit">
                            <div className="hidden items-center gap-2 lg:flex">
                                <Label htmlFor="members-rows" className="text-sm font-medium">
                                    {t('common.rows_per_page')}
                                </Label>
                                <Select
                                    value={`${table.getState().pagination.pageSize}`}
                                    onValueChange={(v) => table.setPageSize(Number(v))}
                                >
                                    <SelectTrigger size="sm" className="w-20" id="members-rows">
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
                                Page {table.getState().pagination.pageIndex + 1} of{' '}
                                {table.getPageCount()}
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
                                                <span className="sr-only">First page</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>First page</TooltipContent>
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
                                                <span className="sr-only">Previous page</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Previous page</TooltipContent>
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
                                                <span className="sr-only">Next page</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Next page</TooltipContent>
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
                                                <span className="sr-only">Last page</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Last page</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pending Invitations */}
                {invitations.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                                {t('settings.team.members.pending_invitations')} ({invitations.length})
                            </span>
                        </div>
                        <div className="rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('settings.team.members.table_email')}</TableHead>
                                        <TableHead>{t('settings.team.members.table_role')}</TableHead>
                                        <TableHead>{t('settings.team.members.table_invited_by')}</TableHead>
                                        <TableHead>{t('settings.team.members.table_sent')}</TableHead>
                                        <TableHead className="w-12" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invitations.map((invitation) => (
                                        <TableRow key={invitation.code}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm">
                                                        {invitation.email}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {invitation.role_label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {invitation.invited_by ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDate(
                                                    invitation.created_at,
                                                   {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    },
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Guard permission="invitation.cancel">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="size-8 text-muted-foreground hover:text-destructive"
                                                                    data-test="invitation-cancel-button"
                                                                    onClick={() => {
                                                                        setInvitationToCancel(
                                                                            invitation,
                                                                        );
                                                                        setCancelInvitationDialogOpen(
                                                                            true,
                                                                        );
                                                                    }}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                {t('settings.team.members.cancel_invitation')}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </Guard>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </div>

            <Guard permission="invitation.create">
                <InviteMemberModal
                    team={team}
                    availableRoles={availableRoles}
                    open={inviteDialogOpen}
                    onOpenChange={setInviteDialogOpen}
                />
            </Guard>

            <RemoveMemberModal
                team={team}
                member={memberToRemove}
                open={removeMemberDialogOpen}
                onOpenChange={setRemoveMemberDialogOpen}
            />

            <CancelInvitationModal
                team={team}
                invitation={invitationToCancel}
                open={cancelInvitationDialogOpen}
                onOpenChange={setCancelInvitationDialogOpen}
            />
        </TeamSettingsLayout>
    );
}
