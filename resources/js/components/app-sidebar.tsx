import { Link, usePage } from '@inertiajs/react';
import {
    CheckSquare,
    FileText,
    FolderKanban,
    LayoutGrid,
    Lock,
    Mail,
    MessageSquare,
    Palette,
    Puzzle,
    Settings,
    Shield,
    ShieldCheck,
    Store,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { NavUser } from '@/components/nav-user';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
    SidebarTrigger,
    useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { edit as editAppearance } from '@/routes/appearance';
import { dashboard } from '@/routes';
import {
    extensions,
    general,
    marketplace,
    mail,
    members,
    roles,
    theme,
} from '@/routes/settings/team';
import { edit as editProfile } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────

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
    FolderKanban,
    CheckSquare,
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
    const page = usePage();
    const { setOpen, isMobile } = useSidebar();
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';

    const teamSlug = (page.props.currentTeam as { slug: string } | null)?.slug ?? '';
    const teamIconUrl = (page.props.currentTeam as { iconUrl?: string } | null)?.iconUrl ?? null;
    const teamName = page.props.currentTeam ? (page.props.currentTeam as { name: string }).name : 'Team';
    const permissions = (page.props.auth?.permissions as string[]) ?? [];
    const can = (perm: string | undefined) => !perm || permissions.includes(perm);

    const extensionNav = (
        (page.props.navigation as { title: string; href: string; icon: string | null; order: number }[] | undefined) ?? []
    );

    const currentUrl = page.url;

    const modules: NavModule[] = useMemo(() => {
        const result: NavModule[] = [];

        // Dashboard
        const dashUrl = teamSlug ? dashboard(teamSlug).url : '/';
        result.push({
            id: 'dashboard',
            label: 'Dashboard',
            icon: LayoutGrid,
            urlPatterns: [dashUrl],
            sections: [{
                title: 'Overview',
                items: [{
                    label: 'Dashboard',
                    icon: LayoutGrid,
                    href: dashUrl,
                }],
            }],
        });

        // Extensions — with direct links to Modules, Themes, Marketplace
        const extSections: NavSection[] = [];
        if (extensionNav.length > 0) {
            extSections.push({
                title: 'Modules',
                items: extensionNav.map((ext) => ({
                    label: ext.title,
                    icon: ext.icon ? iconMap[ext.icon] ?? Puzzle : Puzzle,
                    href: ext.href,
                })),
            });
        }

        const manageItems: NavItem[] = [
            { label: 'Extensions', icon: Puzzle, href: extensions(teamSlug).url, permission: 'extension.view' },
            { label: 'Themes', icon: Palette, href: theme(teamSlug).url, permission: 'extension.view' },
            { label: 'Marketplace', icon: Store, href: marketplace(teamSlug).url, permission: 'extension.view' },
        ].filter((item) => can(item.permission));

        if (manageItems.length > 0) {
            extSections.push({ title: 'Manage', items: manageItems });
        }

        result.push({
            id: 'extensions',
            label: 'Extensions',
            icon: Puzzle,
            urlPatterns: [
                extensions(teamSlug).url,
                theme(teamSlug).url,
                marketplace(teamSlug).url,
                ...extensionNav.map((ext) => ext.href),
            ],
            sections: extSections,
        });

        // Settings
        const settingsItems: NavItem[] = [
            { label: 'General', icon: Settings, href: general(teamSlug).url },
            { label: 'Members', icon: Users, href: members(teamSlug).url, permission: 'member.view' },
            { label: 'Roles', icon: ShieldCheck, href: roles(teamSlug).url, permission: 'role.view' },
            { label: 'Mail', icon: Mail, href: mail(teamSlug).url, permission: 'team.update' },
        ].filter((item) => can(item.permission));

        const accountItems: NavItem[] = [
            { label: 'Profile', icon: Users, href: editProfile().url },
            { label: 'Security', icon: Shield, href: editSecurity().url },
            { label: 'Appearance', icon: Palette, href: editAppearance().url },
        ];

        result.push({
            id: 'settings',
            label: 'Settings',
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
                ...(settingsItems.length > 0 ? [{ title: 'Team', items: settingsItems }] : []),
                { title: 'Account', items: accountItems },
            ],
        });

        return result;
    }, [teamSlug, extensionNav, permissions]);

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

    const [manualKey, setManualKey] = useState<string | null>(null);
    const prevUrl = useRef(currentUrl);
    if (currentUrl !== prevUrl.current) {
        prevUrl.current = currentUrl;
        if (urlActiveKey) setManualKey(null);
    }

    const activeKey = manualKey ?? urlActiveKey ?? modules[0]?.id ?? 'dashboard';

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
                                {isCollapsed && (
                                    <SidebarMenuItem className="hidden items-center justify-center sm:flex">
                                        <SidebarTrigger />
                                    </SidebarMenuItem>
                                )}
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
                    <div className="my-auto text-base font-medium text-foreground">
                        {activeModule?.label}
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
                    <NavUser />
                </SidebarFooter>
            </Sidebar>
        </Sidebar>
    );
}
