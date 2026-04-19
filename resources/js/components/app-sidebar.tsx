import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    CheckSquare,
    FileText,
    FolderGit2,
    FolderKanban,
    LayoutGrid,
    Lock,
    Puzzle,
    Settings,
    ShieldCheck,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import {
    extensions,
    general,
    members,
    roles,
} from '@/routes/settings/team';
import type { NavItem } from '@/types';

const iconMap: Record<string, LucideIcon> = {
    LayoutGrid,
    FolderKanban,
    FolderGit2,
    BookOpen,
    Lock,
    FileText,
    CheckSquare,
};

type ExtensionNavItem = {
    title: string;
    href: string;
    icon: string | null;
    order: number;
};

type TeamNavItem = {
    title: string;
    href: string;
    icon: React.ElementType;
    permission?: string;
};

export function AppSidebar() {
    const page = usePage();
    const teamSlug = (page.props.currentTeam as { slug: string } | null)
        ?.slug;
    const permissions = (page.props.auth?.permissions as string[]) ?? [];
    const dashboardUrl = teamSlug ? dashboard(teamSlug) : '/';

    const can = (perm: string) => permissions.includes(perm);

    const coreNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboardUrl,
            icon: LayoutGrid,
        },
    ];

    const extensionNavItems: NavItem[] = (
        (page.props.navigation as ExtensionNavItem[] | undefined) ?? []
    ).map((item) => ({
        title: item.title,
        href: item.href,
        icon: item.icon ? iconMap[item.icon] ?? null : null,
    }));

    const mainNavItems = [...coreNavItems, ...extensionNavItems];

    const teamNavItems: TeamNavItem[] = [
        {
            title: 'General',
            href: teamSlug ? general(teamSlug).url : '#',
            icon: Settings,
        },
        {
            title: 'Members',
            href: teamSlug ? members(teamSlug).url : '#',
            icon: Users,
            permission: 'member.view',
        },
        {
            title: 'Roles',
            href: teamSlug ? roles(teamSlug).url : '#',
            icon: ShieldCheck,
            permission: 'role.view',
        },
        {
            title: 'Extensions',
            href: teamSlug ? extensions(teamSlug).url : '#',
            icon: Puzzle,
            permission: 'extension.view',
        },
    ].filter(
        (item) =>
            !(
                'permission' in item &&
                item.permission &&
                !can(item.permission)
            ),
    );

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <TeamSwitcher />
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />

                {teamSlug && teamNavItems.length > 0 && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel>Team</SidebarGroupLabel>
                        <SidebarMenu>
                            {teamNavItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        tooltip={{ children: item.title }}
                                    >
                                        <Link href={item.href} prefetch>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
