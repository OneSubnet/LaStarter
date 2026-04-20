import { router, usePage } from '@inertiajs/react';
import { Activity, Check, ChevronsUpDown, Plus, X } from 'lucide-react';
import { useState } from 'react';
import CreateTeamModal from '@/components/create-team-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Sidebar,
    SidebarContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenuButton,
} from '@/components/ui/sidebar';
import { switchMethod } from '@/routes/settings/teams';

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

type TeamMember = {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
    role_label: string;
    is_online: boolean;
};

type AuditEntry = {
    id: number;
    user: string | null;
    action: string;
    module: string | null;
    properties: Record<string, unknown> | null;
    created_at: string | null;
};

function formatTimeAgo(dateStr: string | null): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function formatDateTime(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function SidebarRight() {
    const page = usePage();

    const currentTeam = page.props.currentTeam as { id: number; name: string; slug: string; iconUrl?: string } | undefined;
    const teams = (page.props.teams as { id: number; name: string; slug: string; iconUrl?: string }[]) ?? [];
    const teamMembers = (page.props.teamMembers as TeamMember[]) ?? [];
    const auditLogs = (page.props.auditLogs as AuditEntry[]) ?? [];

    const [selectedLog, setSelectedLog] = useState<AuditEntry | null>(null);

    const switchTeam = (team: { slug: string }) => {
        router.visit(
            switchMethod({ current_team: currentTeam?.slug ?? '', team: team.slug }).url,
            { method: 'post' },
        );
    };

    return (
        <Sidebar
            collapsible="none"
            className="sticky top-0 hidden h-svh border-l lg:flex"
        >
            {/* Header: Team selector */}
            <SidebarHeader className="h-14 border-b">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="w-full data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted text-foreground">
                                {currentTeam?.iconUrl ? (
                                    <Avatar className="size-8 rounded-lg">
                                        <AvatarImage src={currentTeam.iconUrl} alt={currentTeam.name} />
                                    </Avatar>
                                ) : (
                                    <span className="text-xs font-semibold">
                                        {currentTeam ? getInitials(currentTeam.name) : '?'}
                                    </span>
                                )}
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">
                                    {currentTeam?.name ?? 'Select team'}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">
                                    {currentTeam?.slug}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        align="start"
                        side="left"
                    >
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Teams
                        </DropdownMenuLabel>
                        {teams.map((team) => (
                            <DropdownMenuItem
                                key={team.id}
                                className="cursor-pointer gap-2 p-2"
                                onSelect={() => switchTeam(team)}
                            >
                                <div className="flex size-6 items-center justify-center rounded-sm border">
                                    {team.iconUrl ? (
                                        <Avatar className="size-6 rounded-sm">
                                            <AvatarImage src={team.iconUrl} alt={team.name} />
                                        </Avatar>
                                    ) : (
                                        <span className="text-xs">
                                            {getInitials(team.name)}
                                        </span>
                                    )}
                                </div>
                                {team.name}
                                {currentTeam?.id === team.id && (
                                    <Check className="ml-auto size-4" />
                                )}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <CreateTeamModal>
                            <DropdownMenuItem
                                className="cursor-pointer gap-2 p-2"
                                onSelect={(e) => e.preventDefault()}
                            >
                                <div className="flex size-6 items-center justify-center rounded-sm border bg-transparent">
                                    <Plus className="size-4" />
                                </div>
                                <div className="font-medium text-muted-foreground">
                                    New team
                                </div>
                            </DropdownMenuItem>
                        </CreateTeamModal>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarHeader>

            {/* Content */}
            <SidebarContent className="p-0">
                <ScrollArea className="h-[calc(100svh-3.5rem)]">
                    <div className="space-y-6 p-4">
                        {/* Members */}
                        <section className="space-y-3">
                            <SidebarGroupLabel className="text-xs font-medium tracking-wide text-muted-foreground">
                                Members ({teamMembers.length})
                            </SidebarGroupLabel>
                            <div className="space-y-1">
                                {teamMembers.map((member) => {
                                    const initials = getInitials(member.name);
                                    return (
                                        <div
                                            key={member.id}
                                            className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent"
                                        >
                                            <div className="relative">
                                                <Avatar className="h-7 w-7">
                                                    {member.avatar && (
                                                        <AvatarImage src={member.avatar} alt={member.name} />
                                                    )}
                                                    <AvatarFallback className="bg-primary text-xs font-medium text-primary-foreground">
                                                        {initials}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span
                                                    className={`absolute -bottom-0.5 -right-0.5 block size-2.5 rounded-full ring-2 ring-background ${
                                                        member.is_online
                                                            ? 'bg-emerald-500'
                                                            : 'bg-muted-foreground/30'
                                                    }`}
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate text-sm font-medium">
                                                    {member.name}
                                                </div>
                                                <div className="truncate text-xs text-muted-foreground">
                                                    {member.is_online ? 'Online' : member.role_label}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Recent Activity — clickable audit log entries */}
                        <section className="space-y-3">
                            <SidebarGroupLabel className="text-xs font-medium tracking-wide text-muted-foreground">
                                Recent Activity
                            </SidebarGroupLabel>
                            {auditLogs.length === 0 ? (
                                <p className="px-2 text-xs text-muted-foreground/60 italic">
                                    No activity recorded yet.
                                </p>
                            ) : (
                                <div className="space-y-1">
                                    {auditLogs.map((entry) => (
                                        <button
                                            key={entry.id}
                                            type="button"
                                            className="flex w-full gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-accent transition-colors"
                                            onClick={() => setSelectedLog(entry)}
                                        >
                                            <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted">
                                                <Activity className="size-3 text-muted-foreground" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs leading-snug">
                                                    <span className="font-medium">
                                                        {entry.user ?? 'System'}
                                                    </span>{' '}
                                                    <span className="text-muted-foreground">
                                                        {entry.action}
                                                    </span>
                                                </p>
                                                <p className="text-[11px] text-muted-foreground/60">
                                                    {formatTimeAgo(entry.created_at)}
                                                    {entry.module && ` · ${entry.module}`}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </ScrollArea>
            </SidebarContent>

            {/* Audit log detail dialog */}
            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            Activity Detail
                        </DialogTitle>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg border p-3">
                                    <p className="text-xs text-muted-foreground">User</p>
                                    <p className="mt-1 text-sm font-medium">
                                        {selectedLog.user ?? 'System'}
                                    </p>
                                </div>
                                <div className="rounded-lg border p-3">
                                    <p className="text-xs text-muted-foreground">Action</p>
                                    <Badge variant="secondary" className="mt-1">
                                        {selectedLog.action}
                                    </Badge>
                                </div>
                                <div className="rounded-lg border p-3">
                                    <p className="text-xs text-muted-foreground">Module</p>
                                    <p className="mt-1 text-sm font-medium">
                                        {selectedLog.module ?? '—'}
                                    </p>
                                </div>
                                <div className="rounded-lg border p-3">
                                    <p className="text-xs text-muted-foreground">Date</p>
                                    <p className="mt-1 text-sm font-medium">
                                        {formatDateTime(selectedLog.created_at)}
                                    </p>
                                </div>
                            </div>

                            {selectedLog.properties && Object.keys(selectedLog.properties).length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-2">Details</p>
                                        <pre className="rounded-lg bg-muted p-3 text-xs overflow-x-auto max-h-60">
                                            {JSON.stringify(selectedLog.properties, null, 2)}
                                        </pre>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Sidebar>
    );
}
