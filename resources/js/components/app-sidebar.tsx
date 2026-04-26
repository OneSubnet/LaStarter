import { Link, router, usePage } from '@inertiajs/react';
import {
    Bell,
    Calculator,
    Calendar,
    CheckSquare,
    ChevronDown,
    Check,
    Feather,
    FileText,
    FolderKanban,
    FolderOpen,
    LayoutDashboard,
    LayoutGrid,
    Lock,
    Mail,
    MessageCircle,
    MessageSquare,
    Package,
    Palette,
    Puzzle,
    Receipt,
    Settings,
    Shield,
    ShieldCheck,
    Store,
    Users,
    Megaphone,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavUser } from '@/components/nav-user';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as notificationsIndex, read as readNotification, readAll as readAllNotifications } from '@/routes/notifications';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editProfile } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import {
    extensions,
    general,
    marketplace,
    mail,
    members,
    roles,
} from '@/routes/settings/team';

// ── Types ──────────────────────────────────────────────

type ExtensionNavChild = {
    title: string;
    href: string;
    icon: string | null;
    order: number;
    group?: string | null;
};

type ExtensionNavItem = {
    title: string;
    href?: string;
    icon: string | null;
    order: number;
    children?: ExtensionNavChild[];
};

type NavItem = {
    label: string;
    icon: LucideIcon;
    href: string;
    permission?: string;
};

type NavSection = {
    title?: string;
    items: NavItem[];
};

type NavModule = {
    id: string;
    label: string;
    icon: LucideIcon;
    sections: NavSection[];
    urlPatterns: string[];
};

// ── Icon map ───────────────────────────────────────────

const iconMap: Record<string, LucideIcon> = {
    LayoutGrid,
    LayoutDashboard,
    FolderKanban,
    FolderOpen,
    CheckSquare,
    Feather,
    Lock,
    FileText,
    Settings,
    Users,
    ShieldCheck,
    Puzzle,
    Mail,
    Shield,
    Palette,
    MessageSquare,
    MessageCircle,
    Package,
    Calendar,
    Receipt,
    Calculator,
    Store,
};

// ── Helpers ────────────────────────────────────────────

type SidebarNotification = {
    id: number;
    title: string;
    body: string | null;
    data: Record<string, unknown> | null;
    read_at: string | null;
    created_at: string;
};

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

function NotificationBell({ teamSlug }: { teamSlug: string }) {
    const { t } = useTranslation();
    const page = usePage();
    const unreadCount = (page.props.unreadNotifications as number) ?? 0;
    const notifications = (page.props.recentNotifications as SidebarNotification[]) ?? [];
    const [open, setOpen] = useState(false);

    const markRead = (id: number) => {
        router.post(readNotification.url({ current_team: teamSlug, id }), {}, { preserveScroll: true });
    };

    const markAllRead = () => {
        router.post(readAllNotifications.url({ current_team: teamSlug }), {}, { preserveScroll: true });
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
                <div className="border-t px-4 py-2">
                    <Button variant="ghost" size="sm" className="w-full text-xs" asChild onClick={() => setOpen(false)}>
                        <Link href={notificationsIndex(teamSlug).url}>
                            {t('notifications.view_all')}
                        </Link>
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function urlMatches(currentUrl: string, patterns: string[]): boolean {
    return patterns.some((pattern) => currentUrl === pattern || currentUrl.startsWith(pattern + '/'));
}

// ── Module Panel (expanded panel content) ──────────────

function ModulePanel({ module }: { module: NavModule }) {
    const { isCurrentUrl } = useCurrentUrl();

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

                            return (
                                <SidebarMenuItem
                                    key={item.label}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isCurrentUrl(item.href)}
                                        className="px-2"
                                    >
                                        <Link href={item.href} prefetch>
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

// ── App Sidebar (dual-panel) ───────────────────────────

export function AppSidebar() {
    const { t } = useTranslation();
    const page = usePage();
    const { setOpen, isMobile } = useSidebar();

    const teamSlug = (page.props.currentTeam as { slug: string } | null)?.slug ?? '';
    const teamIconUrl = (page.props.currentTeam as { iconUrl?: string } | null)?.iconUrl ?? null;
    const teamName = page.props.currentTeam ? (page.props.currentTeam as { name: string }).name : t('common.team');
    const permissions = (page.props.auth?.permissions as string[]) ?? [];
    const can = (perm: string | undefined) => !perm || permissions.includes(perm);

    const extensionNav = (
        (page.props.navigation as ExtensionNavItem[] | undefined) ?? []
    );

    const currentUrl = page.url;

    const modules: NavModule[] = useMemo(() => {
        const result: NavModule[] = [];

        // Dashboard
        const dashUrl = teamSlug ? dashboard(teamSlug).url : '/';
        result.push({
            id: 'dashboard',
            label: t('common.dashboard'),
            icon: LayoutGrid,
            urlPatterns: [dashUrl],
            sections: [{
                title: t('components.app_sidebar.overview'),
                items: [{
                    label: t('common.dashboard'),
                    icon: LayoutGrid,
                    href: dashUrl,
                }],
            }],
        });

        // Extension modules — each grouped extension gets its own rail entry
        const flatExtItems: { title: string; href: string; icon: string | null }[] = [];

        for (const ext of extensionNav) {
            if (ext.children && ext.children.length > 0) {
                // Each grouped extension becomes its own module in the icon rail
                const extIcon = ext.icon ? iconMap[ext.icon] ?? Puzzle : Puzzle;

                // Group children by their `group` field
                const groupMap = new Map<string, typeof ext.children>();
                for (const child of ext.children) {
                    const key = child.group ?? '';
                    if (!groupMap.has(key)) groupMap.set(key, []);
                    groupMap.get(key)!.push(child);
                }

                const groupLabelMap: Record<string, string> = {
                    overview: t('ai.nav.overview'),
                    crm: t('ai.nav.crm'),
                    operations: t('ai.nav.operations'),
                    finance: t('ai.nav.finance'),
                    communication: t('ai.nav.communication'),
                };

                const sections: NavSection[] = [];
                for (const [groupKey, children] of groupMap) {
                    sections.push({
                        title: groupKey ? (groupLabelMap[groupKey] ?? groupKey) : undefined,
                        items: children.map((child) => ({
                            label: child.title,
                            icon: child.icon ? iconMap[child.icon] ?? Puzzle : Puzzle,
                            href: child.href,
                        })),
                    });
                }

                result.push({
                    id: `ext-${ext.title}`,
                    label: ext.title,
                    icon: extIcon,
                    urlPatterns: ext.children.map((child) => child.href),
                    sections,
                });
                flatExtItems.push(...ext.children);
            } else if (ext.href) {
                flatExtItems.push({ title: ext.title, href: ext.href, icon: ext.icon });
            }
        }

        // Generic Extensions module — flat nav items + management (Modules, Themes, Marketplace)
        const extSections: NavSection[] = flatExtItems
            .filter((item) => !extensionNav.some((ext) => ext.children?.some((c) => c.href === item.href)))
            .map((item) => ({
                items: [{
                    label: item.title,
                    icon: item.icon ? iconMap[item.icon] ?? Puzzle : Puzzle,
                    href: item.href,
                }],
            }));

        const manageItems: NavItem[] = [
            { label: t('common.extensions_and_themes'), icon: Puzzle, href: extensions(teamSlug).url, permission: 'extension.view' },
            { label: t('common.marketplace'), icon: Store, href: marketplace(teamSlug).url, permission: 'extension.view' },
        ].filter((item) => can(item.permission));

        if (extSections.length > 0 || manageItems.length > 0) {
            const sections: NavSection[] = [
                ...extSections,
                ...(manageItems.length > 0 ? [{ title: t('components.app_sidebar.manage'), items: manageItems }] : []),
            ];

            result.push({
                id: 'extensions',
                label: t('common.extensions_and_themes'),
                icon: Puzzle,
                urlPatterns: [
                    extensions(teamSlug).url,
                    marketplace(teamSlug).url,
                    ...flatExtItems
                        .filter((item) => !extensionNav.some((ext) => ext.children?.some((c) => c.href === item.href)))
                        .map((ext) => ext.href),
                ],
                sections,
            });
        }

        // Settings
        const settingsItems: NavItem[] = [
            { label: t('common.general'), icon: Settings, href: general(teamSlug).url },
            { label: t('common.members'), icon: Users, href: members(teamSlug).url, permission: 'member.view' },
            { label: t('common.roles'), icon: ShieldCheck, href: roles(teamSlug).url, permission: 'role.view' },
            { label: t('common.mail'), icon: Mail, href: mail(teamSlug).url, permission: 'team.update' },
        ].filter((item) => can(item.permission));

        const accountItems: NavItem[] = [
            { label: t('common.profile'), icon: Users, href: editProfile().url },
            { label: t('common.security'), icon: Shield, href: editSecurity().url },
            { label: t('common.appearance'), icon: Palette, href: editAppearance().url },
        ];

        result.push({
            id: 'settings',
            label: t('common.settings'),
            icon: Settings,
            urlPatterns: [
                general(teamSlug).url,
                members(teamSlug).url,
                roles(teamSlug).url,
                mail(teamSlug).url,
                editProfile().url,
                editSecurity().url,
                editAppearance().url,
                '/settings',
            ],
            sections: [
                ...(settingsItems.length > 0 ? [{ title: t('common.team'), items: settingsItems }] : []),
                { title: t('common.account'), items: accountItems },
            ],
        });

        return result;
    }, [teamSlug, extensionNav, permissions, can, t]);

    // Derive active module from current URL
    const urlActiveKey = useMemo(() => {
        for (const mod of modules) {
            if (urlMatches(currentUrl, mod.urlPatterns)) {
                return mod.id;
            }
        }

        for (const mod of modules) {
            for (const section of mod.sections) {
                for (const item of section.items) {
                    if (currentUrl === item.href || currentUrl.startsWith(item.href + '/')) {
                        return mod.id;
                    }
                }
            }
        }

        return null;
    }, [currentUrl, modules]);

    const [manualOverride, setManualOverride] = useState<{ url: string; key: string } | null>(null);

    const setManualKey = (key: string) => setManualOverride({ url: currentUrl, key });

    const effectiveManualKey = manualOverride?.url === currentUrl ? manualOverride.key : null;

    const activeKey = effectiveManualKey ?? urlActiveKey ?? modules[0]?.id ?? 'dashboard';

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
                                                tooltip={{
                                                    children: module.label,
                                                    hidden: isMobile,
                                                }}
                                                onClick={() => {
                                                    setManualKey(module.id);
                                                    setOpen(true);
                                                }}
                                                isActive={activeKey === module.id}
                                                aria-label={module.label}
                                                className="px-2.5 md:px-2"
                                            >
                                                <Icon className="size-4" />
                                                <span>{module.label}</span>
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
                        <NotificationBell teamSlug={teamSlug} />
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
                    <NavUser />
                </SidebarFooter>
            </Sidebar>
        </Sidebar>
    );
}
