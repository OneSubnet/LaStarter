import { Link, usePage } from '@inertiajs/react';
import { Mail, Puzzle, Settings, ShieldCheck, Users } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { cn } from '@/lib/utils';
import {
    extensions,
    general,
    mail,
    members,
    roles,
} from '@/routes/settings/team';
import type { BreadcrumbItem } from '@/types';

type SettingsTab = {
    title: string;
    href: string;
    icon: React.ElementType;
    permission?: string;
};

export default function TeamSettingsLayout({
    breadcrumbs = [],
    wide = false,
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    activeTab?: string;
    wide?: boolean;
    children: React.ReactNode;
}) {
    const { currentTeam, auth } = usePage().props;
    const teamSlug = (currentTeam as { slug: string } | null)?.slug ?? '';
    const permissions = (auth?.permissions as string[]) ?? [];
    const can = (perm: string) => permissions.includes(perm);
    const { isCurrentOrParentUrl } = useCurrentUrl();

    const allTabs: SettingsTab[] = [
        { title: 'General', href: general(teamSlug).url, icon: Settings },
        {
            title: 'Members',
            href: members(teamSlug).url,
            icon: Users,
            permission: 'member.view',
        },
        {
            title: 'Roles',
            href: roles(teamSlug).url,
            icon: ShieldCheck,
            permission: 'role.view',
        },
        {
            title: 'Extensions',
            href: extensions(teamSlug).url,
            icon: Puzzle,
            permission: 'extension.view',
        },
        {
            title: 'Mail',
            href: mail(teamSlug).url,
            icon: Mail,
            permission: 'team.update',
        },
    ];

    const tabs = allTabs.filter(
        (tab) => !tab.permission || can(tab.permission),
    );

    const teamName =
        (currentTeam as { name?: string } | null)?.name ?? 'Team';

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            <div className="px-4 py-6">
                <Heading
                    title={`${teamName} settings`}
                    description="Manage your team settings"
                />

                <div className="flex flex-col lg:flex-row lg:space-x-12">
                    <aside className="w-full max-w-xl lg:w-48">
                        <nav className="flex flex-col space-y-1 space-x-0" aria-label="Team settings">
                            {tabs.map((tab) => (
                                <Button
                                    key={tab.title}
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        'w-full justify-start',
                                        isCurrentOrParentUrl(tab.href) &&
                                            'bg-muted',
                                    )}
                                >
                                    <Link href={tab.href} prefetch>
                                        <tab.icon className="h-4 w-4" />
                                        {tab.title}
                                    </Link>
                                </Button>
                            ))}
                        </nav>
                    </aside>

                    <Separator className="my-6 lg:hidden" />

                    <div className={wide ? 'flex-1' : 'flex-1 md:max-w-2xl'}>
                        <section className={wide ? 'w-full space-y-6' : 'max-w-xl space-y-6'}>
                            {children}
                        </section>
                    </div>
                </div>
            </div>
        </AppLayoutTemplate>
    );
}
