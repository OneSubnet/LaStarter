import { Link, router, usePage } from '@inertiajs/react';
import {
    Bell,
    Check,
    ChevronsUpDown,
    ClipboardList,
    FileText,
    Feather,
    LayoutDashboard,
    LogOut,
    Megaphone,
    MessageCircle,
    Receipt,
    User,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePortalUrl } from '../hooks/use-portal-url';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────

type NavItem = {
    label: string;
    icon: typeof LayoutDashboard;
    href: string;
};

type NavModule = {
    id: string;
    label: string;
    icon: typeof LayoutDashboard;
    sections: { title?: string; items: NavItem[] }[];
    urlPatterns: string[];
    defaultHref?: string;
};

type SidebarNotification = {
    id: number;
    title: string;
    body: string | null;
    data: Record<string, unknown> | null;
    read_at: string | null;
    created_at: string;
};

// ── Helpers ────────────────────────────────────────────

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function timeAgo(dateStr: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
}

function urlMatches(currentUrl: string, patterns: string[]): boolean {
    return patterns.some((p) => currentUrl === p || currentUrl.startsWith(p + '/'));
}

// ── NotificationBell ───────────────────────────────────

function PortalNotificationBell() {
    const { t } = useTranslation();
    const page = usePage();
    const p = usePortalUrl();
    const unreadCount = (page.props.unreadNotifications as number) ?? 0;
    const notifications = (page.props.recentNotifications as SidebarNotification[]) ?? [];
    const [open, setOpen] = useState(false);

    const markRead = (id: number) => {
        router.post(p('/notifications/' + id + '/read'), {}, { preserveScroll: true });
    };

    const markAllRead = () => {
        router.post(p('/notifications/read-all'), {}, { preserveScroll: true });
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-8 w-8 shrink-0">
                    <Bell className="size-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <p className="text-sm font-semibold">{t('notifications.title')}</p>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={markAllRead}>
                            <Check className="size-3" />
                            {t('notifications.mark_all_read')}
                        </Button>
                    )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Bell className="mb-2 size-8 opacity-40" />
                            <p className="text-sm">{t('notifications.empty')}</p>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <button
                                key={n.id}
                                type="button"
                                className={cn(
                                    'flex w-full flex-col gap-0.5 border-b px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted/50',
                                    !n.read_at && 'bg-muted/30',
                                )}
                                onClick={() => {
                                    if (!n.read_at) markRead(n.id);
                                    const url = n.data?.url as string | undefined;
                                    if (url) {
                                        setOpen(false);
                                        router.visit(url);
                                    }
                                }}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-medium leading-tight">{n.title}</p>
                                    <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo(n.created_at)}</span>
                                </div>
                                {n.body && (
                                    <p className="line-clamp-1 text-xs text-muted-foreground">{n.body}</p>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

// ── NavPortalUser (dropdown) ───────────────────────────

function NavPortalUser() {
    const { t } = useTranslation();
    const { state } = useSidebar();
    const page = usePage();
    const portalClient = page.props.portalClient as { name: string; email: string } | undefined;

    if (!portalClient) return null;

    const cleanup = () => {
        document.body.style.removeProperty('pointer-events');
    };

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="group text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent"
                        >
                            <Avatar className="h-8 w-8 overflow-hidden rounded-lg">
                                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                                    {getInitials(portalClient.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">{portalClient.name}</span>
                                <span className="truncate text-xs text-muted-foreground">{portalClient.email}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        align="end"
                        side={state === 'collapsed' ? 'left' : 'bottom'}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 overflow-hidden rounded-lg">
                                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                                        {getInitials(portalClient.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">{portalClient.name}</span>
                                    <span className="truncate text-xs text-muted-foreground">{portalClient.email}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link className="block w-full cursor-pointer" href="/portal/settings" onClick={cleanup}>
                                <User className="mr-2" />
                                {t('ai.portal.profile')}
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link
                                className="block w-full cursor-pointer"
                                href="/portal/logout"
                                as="button"
                                method="post"
                                onClick={handleLogout}
                            >
                                <LogOut className="mr-2" />
                                {t('common.log_out')}
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

// ── ModulePanel (expanded panel content) ───────────────

function ModulePanel({ module }: { module: NavModule }) {
    const currentUrl = usePage().url;

    return (
        <div className="space-y-4 px-4 py-3 text-sm">
            {module.sections.map((section, i) => (
                <div className="space-y-2" key={section.title ?? i}>
                    {section.title && (
                        <SidebarGroupLabel className="mb-1 text-xs font-medium tracking-wide text-muted-foreground">
                            {section.title}
                        </SidebarGroupLabel>
                    )}
                    <SidebarMenu>
                        {section.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentUrl === item.href || currentUrl.startsWith(item.href + '/');

                            return (
                                <SidebarMenuItem
                                    key={item.label}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive}
                                        className="px-2"
                                    >
                                        <Link href={item.href}>
                                            <Icon className="size-4" />
                                            <span>{item.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </div>
            ))}
        </div>
    );
}

// ── Portal Sidebar (dual-panel, same as AppSidebar) ────

export function PortalSidebar() {
    const { t } = useTranslation();
    const page = usePage();
    const { isMobile, setOpen } = useSidebar();
    const p = usePortalUrl();

    const currentTeam = page.props.currentTeam as { name: string; slug: string; iconUrl?: string } | null;
    const teamName = currentTeam?.name ?? t('common.team');
    const teamIconUrl = currentTeam?.iconUrl ?? null;
    const currentUrl = page.url;

    const modules: NavModule[] = useMemo(() => {
        const result: NavModule[] = [];

        // Dashboard module
        result.push({
            id: 'dashboard',
            label: t('ai.portal.dashboard'),
            icon: LayoutDashboard,
            urlPatterns: [p('/dashboard')],
            defaultHref: p('/dashboard'),
            sections: [{
                title: t('components.app_sidebar.overview'),
                items: [{
                    label: t('ai.portal.dashboard'),
                    icon: LayoutDashboard,
                    href: p('/dashboard'),
                }],
            }],
        });

        // Espace Client module (grouped portal items)
        result.push({
            id: 'portal',
            label: t('ai.portal.client_space'),
            icon: Feather,
            urlPatterns: [
                p('/documents'),
                p('/invoices'),
                p('/quotes'),
                p('/chat'),
                p('/settings'),
            ],
            defaultHref: p('/documents'),
            sections: [
                {
                    title: t('ai.nav.overview'),
                    items: [
                        { label: t('ai.portal.documents'), icon: FileText, href: p('/documents') },
                        { label: t('ai.portal.invoices'), icon: Receipt, href: p('/invoices') },
                        { label: t('ai.portal.quotes'), icon: ClipboardList, href: p('/quotes') },
                    ],
                },
                {
                    title: t('ai.nav.communication'),
                    items: [
                        { label: t('ai.portal.messages'), icon: MessageCircle, href: p('/chat') },
                    ],
                },
                {
                    title: t('ai.nav.crm'),
                    items: [
                        { label: t('ai.portal.profile'), icon: User, href: p('/settings') },
                    ],
                },
            ],
        });

        return result;
    }, [t, p]);

    // Derive active module from current URL
    const activeKey = useMemo(() => {
        for (const mod of modules) {
            if (urlMatches(currentUrl, mod.urlPatterns)) {
                return mod.id;
            }
            for (const section of mod.sections) {
                for (const item of section.items) {
                    if (currentUrl === item.href || currentUrl.startsWith(item.href + '/')) {
                        return mod.id;
                    }
                }
            }
        }
        return modules[0]?.id ?? 'dashboard';
    }, [currentUrl, modules]);

    const activeModule = modules.find((m) => m.id === activeKey) ?? modules[0];

    return (
        <Sidebar
            collapsible="icon"
            className={cn('overflow-hidden *:data-[sidebar=sidebar]:flex-row')}
        >
            {/* ── Icon Rail ─────────────────────────────────── */}
            <Sidebar
                collapsible="none"
                className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
            >
                <SidebarHeader className="h-14 border-b">
                    <SidebarMenu className="my-auto">
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                size="lg"
                                className="md:h-8 md:w-8 md:p-0 md:justify-center"
                                tooltip={{ children: teamName }}
                            >
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted text-foreground">
                                    {teamIconUrl ? (
                                        <Avatar className="size-8 rounded-lg">
                                            <AvatarImage src={teamIconUrl} alt={teamName} />
                                        </Avatar>
                                    ) : (
                                        <span className="text-xs font-semibold">
                                            {getInitials(teamName)}
                                        </span>
                                    )}
                                </div>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>

                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupContent className="px-1.5 md:px-0">
                            <SidebarMenu>
                                {modules.map((module) => {
                                    const Icon = module.icon;

                                    return (
                                        <SidebarMenuItem key={module.id}>
                                            <SidebarMenuButton
                                                asChild={!!module.defaultHref}
                                                tooltip={{
                                                    children: module.label,
                                                    hidden: isMobile,
                                                }}
                                                isActive={activeKey === module.id}
                                                aria-label={module.label}
                                                className="px-2.5 md:px-2"
                                                {...(module.defaultHref
                                                    ? {
                                                        onClick: () => {
                                                            setOpen(true);
                                                            router.visit(module.defaultHref!);
                                                        },
                                                    }
                                                    : {
                                                        onClick: () => {
                                                            setOpen(true);
                                                        },
                                                    })}
                                            >
                                                {module.defaultHref ? (
                                                    <Link href={module.defaultHref}>
                                                        <Icon className="size-4" />
                                                        <span>{module.label}</span>
                                                    </Link>
                                                ) : (
                                                    <>
                                                        <Icon className="size-4" />
                                                        <span>{module.label}</span>
                                                    </>
                                                )}
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
            </Sidebar>

            {/* ── Expanded Panel ────────────────────────────── */}
            <Sidebar collapsible="none" className="hidden flex-1 md:flex">
                <SidebarHeader className="h-14 border-b px-4">
                    <div className="flex w-full items-center justify-between">
                        <div className="my-auto text-base font-medium text-foreground">
                            {activeModule?.label}
                        </div>
                        <PortalNotificationBell />
                    </div>
                </SidebarHeader>

                <SidebarContent className="overflow-hidden">
                    <SidebarGroup className="px-0">
                        <SidebarGroupContent>
                            {activeModule && <ModulePanel module={activeModule} />}
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>

                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild className="px-2 text-muted-foreground hover:text-foreground">
                                <a href="https://discord.gg/KrVEWA9X" target="_blank" rel="noopener noreferrer">
                                    <Megaphone className="size-4" />
                                    <span>{t('common.feedback')}</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                    <NavPortalUser />
                </SidebarFooter>
            </Sidebar>
        </Sidebar>
    );
}
