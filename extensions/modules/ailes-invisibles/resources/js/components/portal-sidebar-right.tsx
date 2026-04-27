import { usePage } from '@inertiajs/react';
import { Activity, FileText } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateTime as fmtDateTimeLib } from '@/lib/format';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Sidebar,
    SidebarContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenuButton,
} from '@/components/ui/sidebar';

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

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
    return fmtDateTimeLib(dateStr, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function PortalSidebarRight() {
    const { t } = useTranslation();
    const page = usePage();

    const currentTeam = page.props.currentTeam as { id: number; name: string; slug: string; iconUrl?: string } | null;
    const portalClient = page.props.portalClient as { name: string; email: string } | undefined;
    const auditLogs = (page.props.auditLogs as AuditEntry[]) ?? [];

    const [selectedLog, setSelectedLog] = useState<AuditEntry | null>(null);

    return (
        <Sidebar
            collapsible="none"
            className="sticky top-0 hidden h-svh border-l lg:flex"
        >
            {/* Header: Team info */}
            <SidebarHeader className="h-14 border-b">
                <SidebarMenuButton
                    size="lg"
                    className="w-full"
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
                            {currentTeam?.name ?? t('common.team')}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                            {portalClient?.name ?? ''}
                        </span>
                    </div>
                </SidebarMenuButton>
            </SidebarHeader>

            {/* Content */}
            <SidebarContent className="p-0">
                <ScrollArea className="h-[calc(100svh-3.5rem)]">
                    <div className="space-y-6 p-4">
                        {/* Client info */}
                        {portalClient && (
                            <section className="space-y-3">
                                <SidebarGroupLabel className="text-xs font-medium tracking-wide text-muted-foreground">
                                    {t('ai.portal.profile')}
                                </SidebarGroupLabel>
                                <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
                                    <div className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                                        {getInitials(portalClient.name)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{portalClient.name}</p>
                                        <p className="truncate text-xs text-muted-foreground">{portalClient.email}</p>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Recent Activity */}
                        <section className="space-y-3">
                            <SidebarGroupLabel className="text-xs font-medium tracking-wide text-muted-foreground">
                                {t('components.sidebar_right.recent_activity')}
                            </SidebarGroupLabel>
                            {auditLogs.length === 0 ? (
                                <p className="px-2 text-xs text-muted-foreground/60 italic">
                                    {t('components.sidebar_right.no_activity')}
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
                            {t('components.sidebar_right.activity_detail')}
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
