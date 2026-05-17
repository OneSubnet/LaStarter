import { Link, router, usePage } from '@inertiajs/react';
import { Bell, Check, CheckCircle2, FileText, Megaphone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
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
import { timeAgo } from '@/lib/format';
import { iconMap, DEFAULT_ICON } from '@/lib/icon-map';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { edit as editAppearance } from '@/routes/appearance';
import {
    index as notificationsIndex,
    read as readNotification,
    readAll as readAllNotifications,
} from '@/routes/notifications';
import { edit as editProfile } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import {
    extensions,
    general,
    mail,
    marketplace,
    members,
    roles,
} from '@/routes/settings/team';
import type { SharedData } from '@/types';
import type { ExtensionNavChild, ExtensionNavItem } from '@/types/navigation';
import type { ContextualSidebar } from '@/types/shared-data';

// ── Types ──────────────────────────────────────────────

type NavItem = {
    label: string;
    icon: LucideIcon;
    href: string;
    permission?: string;
    badge?: number | null;
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

// ── Helpers ────────────────────────────────────────────

function NotificationBell({ teamSlug }: { teamSlug: string }) {
    const { t } = useTranslation();
    const page = usePage<SharedData>();
    const unreadCount = page.props.unreadNotifications;
    const notifications = page.props.recentNotifications;
    const [open, setOpen] = useState(false);

    const markRead = (id: string) => {
        router.post(
            readNotification.url({ current_team: teamSlug, id }),
            {},
            { preserveScroll: true },
        );
    };

    const markAllRead = () => {
        router.post(
            readAllNotifications.url({ current_team: teamSlug }),
            {},
            { preserveScroll: true },
        );
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-8 w-8 shrink-0"
                >
                    <Bell className="size-4" />
                    {unreadCount > 0 ? (
                        <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    ) : null}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <p className="text-sm font-semibold">
                        {t('notifications.title')}
                    </p>
                    {unreadCount > 0 ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs"
                            onClick={markAllRead}
                        >
                            <Check className="size-3" />
                            {t('notifications.mark_all_read')}
                        </Button>
                    ) : null}
                </div>
                <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Bell className="mb-2 size-8 opacity-40" />
                            <p className="text-sm">
                                {t('notifications.empty')}
                            </p>
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
                                    if (!n.read_at) {
                                        markRead(n.id);
                                    }

                                    const url = n.data?.url as
                                        | string
                                        | undefined;

                                    if (url) {
                                        setOpen(false);
                                        router.visit(url);
                                    }
                                }}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm leading-tight font-medium">
                                        {n.title}
                                    </p>
                                    <span className="shrink-0 text-[10px] text-muted-foreground">
                                        {timeAgo(n.created_at ?? '')}
                                    </span>
                                </div>
                                {n.body && (
                                    <p className="line-clamp-1 text-xs text-muted-foreground">
                                        {n.body}
                                    </p>
                                )}
                            </button>
                        ))
                    )}
                </div>
                <div className="border-t px-4 py-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        asChild
                        onClick={() => setOpen(false)}
                    >
                        <Link href={notificationsIndex(teamSlug).url}>
                            {t('notifications.view_all')}
                        </Link>
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

function urlMatches(currentUrl: string, patterns: string[]): boolean {
    return patterns.some(
        (pattern) =>
            currentUrl === pattern || currentUrl.startsWith(pattern + '/'),
    );
}

// ── Module Panel (expanded panel content) ──────────────

function ModulePanel({ module }: { module: NavModule }) {
    const { isCurrentUrl } = useCurrentUrl();
    const page = usePage<SharedData>();
    const unreadMessageCount = page.props.unreadMessageCount;

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
                            const isMessaging = item.href.includes(
                                '/ai/conversations/inbox',
                            );
                            const badge =
                                isMessaging && unreadMessageCount > 0
                                    ? unreadMessageCount
                                    : (item.badge ?? null);

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
                                            {badge !== null ? (
                                                <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                                                    {badge > 99 ? '99+' : badge}
                                                </span>
                                            ) : null}
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

// ── Contextual Panel (injected by modules via Hook) ────

function contextualIcon(icon: string) {
    switch (icon) {
        case 'check':
            return <Check className="size-3.5 shrink-0 text-green-500" />;
        case 'video':
            return (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-3.5 shrink-0 text-muted-foreground"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polygon points="6 3 20 12 6 21 6 3" />
                </svg>
            );
        case 'quiz':
            return (
                <CheckCircle2 className="size-3.5 shrink-0 text-muted-foreground" />
            );
        default:
            return (
                <FileText className="size-3.5 shrink-0 text-muted-foreground" />
            );
    }
}

function ContextualPanel({ data }: { data: ContextualSidebar }) {
    const { header, sections } = data;

    return (
        <div className="flex flex-col">
            {header && (
                <div className="border-b px-3 py-3">
                    {header.href ? (
                        <Link
                            href={header.href}
                            className="text-sm leading-snug font-semibold hover:underline"
                        >
                            {header.title}
                        </Link>
                    ) : (
                        <p className="text-sm leading-snug font-semibold">
                            {header.title}
                        </p>
                    )}
                    {header.progress != null && (
                        <div className="mt-2 flex items-center gap-2">
                            <div className="h-1.5 flex-1 rounded-full bg-muted">
                                <div
                                    className={`h-1.5 rounded-full transition-all ${header.progress >= 100 ? 'bg-green-500' : 'bg-primary'}`}
                                    style={{ width: `${header.progress}%` }}
                                />
                            </div>
                            <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                                {header.progress}%
                            </span>
                        </div>
                    )}
                    {header.subtitle && header.progress == null && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {header.subtitle}
                        </p>
                    )}
                </div>
            )}
            <div className="flex-1 overflow-y-auto">
                {sections.map((section, i) => (
                    <div key={i}>
                        {section.title && (
                            <p className="px-3 pt-3 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
                                {section.title}
                            </p>
                        )}
                        <div className="space-y-px">
                            {section.items.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-2 px-3 py-1.5 text-[13px] transition-colors',
                                        item.active
                                            ? 'bg-accent font-medium text-accent-foreground'
                                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                                    )}
                                >
                                    {contextualIcon(item.icon)}
                                    <span className="min-w-0 flex-1 truncate">
                                        {item.title}
                                    </span>
                                    {item.meta && (
                                        <span className="shrink-0 text-[11px] text-muted-foreground/70">
                                            {item.meta}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── App Sidebar (dual-panel) ───────────────────────────

export function AppSidebar() {
    const { t } = useTranslation();
    const page = usePage<SharedData>();
    const { setOpen, isMobile } = useSidebar();

    const teamSlug = page.props.currentTeam?.slug ?? '';
    const permissions = new Set(page.props.auth?.permissions ?? []);
    const can = (perm: string | undefined) => !perm || permissions.has(perm);

    const coreUpdateAvailable = page.props.coreUpdateAvailable;
    const extensionUpdateCount = page.props.extensionUpdateCount;
    const systemBadgeCount =
        coreUpdateAvailable || extensionUpdateCount > 0
            ? (coreUpdateAvailable ? 1 : 0) + extensionUpdateCount
            : null;

    const extensionNav =
        (page.props.navigation as ExtensionNavItem[] | undefined) ?? [];

    const currentUrl = page.url;

    const modules: NavModule[] = useMemo(() => {
        const result: NavModule[] = [];

        // Dashboard
        const dashUrl = teamSlug ? dashboard(teamSlug).url : '/';
        result.push({
            id: 'dashboard',
            label: t('common.dashboard'),
            icon: iconMap.LayoutGrid,
            urlPatterns: [dashUrl],
            sections: [
                {
                    title: t('components.app_sidebar.overview'),
                    items: [
                        {
                            label: t('common.dashboard'),
                            icon: iconMap.LayoutGrid,
                            href: dashUrl,
                        },
                    ],
                },
            ],
        });

        // Extension modules — each grouped extension gets its own rail entry
        const flatExtItems: {
            title: string;
            href: string;
            icon: string | null;
        }[] = [];
        const groupedHrefs = new Set<string>();

        for (const ext of extensionNav) {
            if (ext.children && ext.children.length > 0) {
                const extIcon = ext.icon
                    ? (iconMap[ext.icon] ?? DEFAULT_ICON)
                    : DEFAULT_ICON;

                const groupMap = new Map<string, typeof ext.children>();

                for (const child of ext.children) {
                    const key = child.group ?? '';

                    if (!groupMap.has(key)) {
                        groupMap.set(key, []);
                    }

                    groupMap.get(key)!.push(child);
                    groupedHrefs.add(child.href);
                }

                const sections: NavSection[] = [];

                for (const [groupKey, children] of groupMap) {
                    sections.push({
                        title: groupKey
                            ? t(`nav.groups.${groupKey}`, groupKey)
                            : undefined,
                        items: children.map((child) => ({
                            label: child.title,
                            icon: child.icon
                                ? (iconMap[child.icon] ?? DEFAULT_ICON)
                                : DEFAULT_ICON,
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
            } else if (ext.href) {
                flatExtItems.push({
                    title: ext.title,
                    href: ext.href,
                    icon: ext.icon,
                });
            }
        }

        // Generic Extensions module — flat nav items + management (Modules, Themes, Marketplace)
        const extSections: NavSection[] = flatExtItems
            .filter((item) => !groupedHrefs.has(item.href))
            .map((item) => ({
                items: [
                    {
                        label: item.title,
                        icon: item.icon
                            ? (iconMap[item.icon] ?? DEFAULT_ICON)
                            : DEFAULT_ICON,
                        href: item.href,
                    },
                ],
            }));

        const manageItems: NavItem[] = [
            {
                label: t('common.extensions_and_themes'),
                icon: DEFAULT_ICON,
                href: extensions(teamSlug).url,
                permission: 'extension.view',
                badge: extensionUpdateCount > 0 ? extensionUpdateCount : null,
            },
            {
                label: t('common.marketplace'),
                icon: iconMap.Store,
                href: marketplace(teamSlug).url,
                permission: 'extension.view',
            },
        ].filter((item) => can(item.permission));

        if (extSections.length > 0 || manageItems.length > 0) {
            const sections: NavSection[] = [
                ...extSections,
                ...(manageItems.length > 0
                    ? [
                          {
                              title: t('components.app_sidebar.manage'),
                              items: manageItems,
                          },
                      ]
                    : []),
            ];

            result.push({
                id: 'extensions',
                label: t('common.extensions_and_themes'),
                icon: DEFAULT_ICON,
                urlPatterns: [
                    extensions(teamSlug).url,
                    marketplace(teamSlug).url,
                    ...flatExtItems
                        .filter((item) => !groupedHrefs.has(item.href))
                        .map((ext) => ext.href),
                ],
                sections,
            });
        }

        // Settings
        const settingsItems: NavItem[] = [
            {
                label: t('common.general'),
                icon: iconMap.Settings,
                href: general(teamSlug).url,
            },
            {
                label: t('common.members'),
                icon: iconMap.Users,
                href: members(teamSlug).url,
                permission: 'member.view',
            },
            {
                label: t('common.roles'),
                icon: iconMap.ShieldCheck,
                href: roles(teamSlug).url,
                permission: 'role.view',
            },
            {
                label: t('common.mail'),
                icon: iconMap.Mail,
                href: mail(teamSlug).url,
                permission: 'team.update',
            },
            {
                label: t('common.system'),
                icon: iconMap.Server,
                href: `/${teamSlug}/settings/system`,
                permission: 'system.update',
                badge: systemBadgeCount,
            },
        ].filter((item) => can(item.permission));

        const accountItems: NavItem[] = [
            {
                label: t('common.profile'),
                icon: iconMap.Users,
                href: editProfile().url,
            },
            {
                label: t('common.security'),
                icon: iconMap.Shield,
                href: editSecurity().url,
            },
            {
                label: t('common.appearance'),
                icon: iconMap.Palette,
                href: editAppearance().url,
            },
        ];

        result.push({
            id: 'settings',
            label: t('common.settings'),
            icon: iconMap.Settings,
            urlPatterns: [
                general(teamSlug).url,
                members(teamSlug).url,
                roles(teamSlug).url,
                mail(teamSlug).url,
                `/${teamSlug}/settings/system`,
                editProfile().url,
                editSecurity().url,
                editAppearance().url,
                '/settings',
            ],
            sections: [
                ...(settingsItems.length > 0
                    ? [{ title: t('common.team'), items: settingsItems }]
                    : []),
                { title: t('common.account'), items: accountItems },
            ],
        });

        return result;
    }, [
        teamSlug,
        extensionNav,
        permissions,
        t,
        systemBadgeCount,
        extensionUpdateCount,
    ]);

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
                    if (
                        currentUrl === item.href ||
                        currentUrl.startsWith(item.href + '/')
                    ) {
                        return mod.id;
                    }
                }
            }
        }

        return null;
    }, [currentUrl, modules]);

    const [manualOverride, setManualOverride] = useState<{
        url: string;
        key: string;
    } | null>(null);

    const setManualKey = (key: string) =>
        setManualOverride({ url: currentUrl, key });

    const effectiveManualKey =
        manualOverride?.url === currentUrl ? manualOverride.key : null;

    const activeKey =
        effectiveManualKey ?? urlActiveKey ?? modules[0]?.id ?? 'dashboard';

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
                                                isActive={
                                                    activeKey === module.id
                                                }
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
                <SidebarHeader className="px-2">
                    <div className="flex w-full items-center gap-2">
                        <TeamSwitcher />
                        <NotificationBell teamSlug={teamSlug} />
                    </div>
                </SidebarHeader>

                <SidebarContent className="overflow-hidden">
                    <SidebarGroup className="px-0">
                        <SidebarGroupContent>
                            {page.props.contextualSidebar &&
                            !effectiveManualKey ? (
                                <ContextualPanel
                                    data={page.props.contextualSidebar}
                                />
                            ) : activeModule ? (
                                <ModulePanel module={activeModule} />
                            ) : null}
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>

                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                className="px-2 text-muted-foreground hover:text-foreground"
                            >
                                <a
                                    href="https://discord.gg/KrVEWA9X"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Megaphone className="size-4" />
                                    <span>{t('common.feedback')}</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                    <NavUser />
                    <div className="flex items-center justify-center py-1.5 text-[10px] text-muted-foreground/60">
                        v{usePage<SharedData>().props.coreVersion}
                    </div>
                </SidebarFooter>
            </Sidebar>
        </Sidebar>
    );
}
