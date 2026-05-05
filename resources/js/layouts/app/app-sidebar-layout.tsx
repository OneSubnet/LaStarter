import { Link, router, usePage } from '@inertiajs/react';
import { LayoutGrid, MoreHorizontal, Search, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppSidebar } from '@/components/app-sidebar';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { CmdOrOption } from '@/components/nowts/keyboard-shortcut';
import { Button } from '@/components/ui/button';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator } from '@/components/ui/command';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { Kbd } from '@/components/ui/kbd';

import { Separator } from '@/components/ui/separator';
import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import type { BreadcrumbItem } from '@/types';

type ExtensionNavItem = {
    title: string;
    href?: string;
    icon: string | null;
    children?: { title: string; href: string; icon: string | null }[];
};

const iconMap: Record<string, LucideIcon> = {
    LayoutGrid,
    Settings,
};

function getInitials(name: string) {
    return (
        name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join('') || 'U'
    );
}

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
    headerActions,
}: {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    headerActions?: ReactNode;
}) {
    const page = usePage();
    const isOpen = page.props.sidebarOpen;
    const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
    const [commandOpen, setCommandOpen] = useState(false);

    const currentTeam = page.props.currentTeam as
        | { name: string; slug: string }
        | undefined;
    const extensionNav =
        (page.props.navigation as ExtensionNavItem[] | undefined) ?? [];
    const teamSlug = currentTeam?.slug ?? '';
    const currentPath = page.url;
    const { t } = useTranslation();

    const footerLinks =
        (page.props.footerLinks as
            | { title: string; href: string }[]
            | undefined) ?? [];

    // Command palette keyboard shortcut
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setCommandOpen((o) => !o);
            }
        };
        document.addEventListener('keydown', down);

        return () => document.removeEventListener('keydown', down);
    }, []);

    // Flatten extension nav items for mobile (include children from grouped items)
    const flatExtNav = extensionNav.flatMap((ext) => {
        if (ext.children && ext.children.length > 0) {
            return ext.children.map((child) => ({
                label: child.title,
                icon: child.icon
                    ? (iconMap[child.icon] ?? LayoutGrid)
                    : LayoutGrid,
                href: child.href,
            }));
        }

        return ext.href
            ? [
                  {
                      label: ext.title,
                      icon: ext.icon
                          ? (iconMap[ext.icon] ?? LayoutGrid)
                          : LayoutGrid,
                      href: ext.href,
                  },
              ]
            : [];
    });

    return (
        <SidebarProvider
            defaultOpen={isOpen}
            style={{ '--sidebar-width': '300px' } as React.CSSProperties}
        >
            {/* Desktop left sidebar */}
            <div className="hidden md:block">
                <AppSidebar />
            </div>

            {/* Main content area */}
            <SidebarInset className="pb-20 md:pb-0">
                <div className="flex min-h-0 flex-1 flex-col gap-4">
                    {/* Mobile header */}
                    <div className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background px-4 md:hidden">
                        <SidebarTrigger />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <div className="flex size-8 items-center justify-center rounded-sm bg-primary text-xs font-semibold text-primary-foreground">
                            {currentTeam ? getInitials(currentTeam.name) : '?'}
                        </div>
                        <div className="ml-auto text-sm font-medium text-muted-foreground">
                            {currentTeam?.name}
                        </div>
                    </div>

                    {/* Desktop header with breadcrumbs */}
                    <header className="hidden h-14 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:flex md:px-4">
                        <div className="flex items-center gap-2">
                            <SidebarTrigger className="-ml-1" />
                            <Breadcrumbs breadcrumbs={breadcrumbs} />
                        </div>
                        <div className="ml-auto flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCommandOpen(true)}
                                className="h-8"
                            >
                                <Search className="mr-2 h-4 w-4" />
                                <span className="hidden lg:inline">{t('command.placeholder')}</span>
                                <Kbd className="ml-auto hidden lg:inline-flex">
                                    <CmdOrOption /> + K
                                </Kbd>
                            </Button>
                            {headerActions}
                        </div>
                    </header>

                    {/* Page content */}
                    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
                        {children}
                    </div>

                    {/* Footer links */}
                    {footerLinks.length > 0 && (
                        <footer className="border-t py-3 text-center text-xs text-muted-foreground">
                            <div className="flex items-center justify-center gap-4">
                                {footerLinks.map((link) => (
                                    <a
                                        key={link.href}
                                        href={link.href}
                                        className="hover:text-foreground hover:underline"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {link.title}
                                    </a>
                                ))}
                            </div>
                        </footer>
                    )}
                </div>
            </SidebarInset>

            {/* Mobile drawer for full navigation */}
            <Drawer
                open={isMobilePanelOpen}
                onOpenChange={setIsMobilePanelOpen}
                dismissible
            >
                <DrawerContent className="md:hidden">
                    <DrawerHeader>
                        <DrawerTitle>{t('common.navigation_menu')}</DrawerTitle>
                    </DrawerHeader>
                    <div className="space-y-4 px-4 pb-6">
                        <div className="space-y-1">
                            {[
                                {
                                    label: t('common.dashboard'),
                                    icon: LayoutGrid,
                                    href: `/${teamSlug}`,
                                },
                                ...flatExtNav.slice(0, 6).map((item) => item),
                                {
                                    label: t('common.settings'),
                                    icon: Settings,
                                    href: `/${teamSlug}/settings/general`,
                                },
                            ].map((item) => {
                                const Icon = item.icon;
                                const isActive =
                                    currentPath === item.href ||
                                    (item.href !== `/${teamSlug}` &&
                                        currentPath.startsWith(item.href));

                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        onClick={() =>
                                            setIsMobilePanelOpen(false)
                                        }
                                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                                            isActive
                                                ? 'bg-accent font-medium text-accent-foreground'
                                                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                        }`}
                                    >
                                        <Icon className="size-4" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>

            {/* Mobile bottom nav */}
            <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:hidden">
                <div className="flex items-center justify-around">
                    <Link
                        href={`/${teamSlug}`}
                        className={`flex flex-col items-center justify-center py-3 text-xs ${
                            currentPath === `/${teamSlug}`
                                ? 'text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <LayoutGrid className="h-5 w-5" />
                    </Link>
                    {flatExtNav.slice(0, 2).map((item) => {
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center py-3 text-xs ${
                                    currentPath.startsWith(item.href)
                                        ? 'text-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Icon className="h-5 w-5" />
                            </Link>
                        );
                    })}
                    <Link
                        href={`/${teamSlug}/settings/general`}
                        className={`flex flex-col items-center justify-center py-3 text-xs ${
                            currentPath.includes('/settings')
                                ? 'text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Settings className="h-5 w-5" />
                    </Link>
                    <button
                        type="button"
                        onClick={() => setIsMobilePanelOpen(true)}
                        className="flex flex-col items-center justify-center py-3 text-xs text-muted-foreground hover:text-foreground"
                        aria-label={t('common.more')}
                    >
                        <MoreHorizontal className="h-5 w-5" />
                    </button>
                </div>
            </nav>

            {/* Command Palette Dialog */}
            <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
                <CommandInput placeholder={t('command.placeholder')} />
                <CommandList>
                    <CommandEmpty>{t('command.no_results')}</CommandEmpty>
                    <CommandGroup heading={t('command.navigation')}>
                        <CommandItem onSelect={() => {
 setCommandOpen(false); router.visit(`/${teamSlug}`); 
}}>
                            <LayoutGrid className="h-4 w-4" />
                            <span>{t('common.dashboard')}</span>
                        </CommandItem>
                        {flatExtNav.slice(0, 5).map((item) => {
                            const Icon = item.icon;

                            return (
                                <CommandItem key={item.href} onSelect={() => {
 setCommandOpen(false); router.visit(item.href); 
}}>
                                    <Icon className="h-4 w-4" />
                                    <span>{item.label}</span>
                                </CommandItem>
                            );
                        })}
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading={t('common.settings')}>
                        <CommandItem onSelect={() => {
 setCommandOpen(false); router.visit(`/${teamSlug}/settings/general`); 
}}>
                            <Settings className="h-4 w-4" />
                            <span>{t('common.general')}</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </SidebarProvider>
    );
}
