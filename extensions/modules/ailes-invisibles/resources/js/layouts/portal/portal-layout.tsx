import { Link, usePage } from '@inertiajs/react';
import {
    FileText,
    LayoutDashboard,
    MessageCircle,
    MoreHorizontal,
    Receipt,
    ClipboardList,
    User,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PortalSidebar } from '../../components/portal-sidebar';
import { PortalSidebarRight } from '../../components/portal-sidebar-right';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { Separator } from '@/components/ui/separator';
import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import type { BreadcrumbItem } from '@/types';
import { usePortalUrl } from '../../hooks/use-portal-url';

function useMobileNavItems() {
    const p = usePortalUrl();
    return useMemo(() => [
        { label: 'ai.portal.dashboard', icon: LayoutDashboard, href: p('/dashboard') },
        { label: 'ai.portal.documents', icon: FileText, href: p('/documents') },
        { label: 'ai.portal.invoices', icon: Receipt, href: p('/invoices') },
        { label: 'ai.portal.quotes', icon: ClipboardList, href: p('/quotes') },
        { label: 'ai.portal.messages', icon: MessageCircle, href: p('/chat') },
        { label: 'ai.portal.profile', icon: User, href: p('/settings') },
    ], [p]);
}

function getInitials(name: string) {
    return (
        name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join('') || '?'
    );
}

export default function PortalLayout({
    children,
    breadcrumbs = [],
}: {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}) {
    const mobileNavItems = useMobileNavItems();
    const page = usePage();
    const isOpen = page.props.sidebarOpen;
    const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
    const currentTeam = page.props.currentTeam as { name: string; slug: string } | null;
    const currentPath = page.url;
    const { t } = useTranslation();
    const footerLinks = (page.props.footerLinks as { title: string; href: string }[] | undefined) ?? [];

    return (
        <SidebarProvider
            defaultOpen={isOpen}
            style={{ '--sidebar-width': '300px' } as React.CSSProperties}
        >
            {/* Desktop left sidebar */}
            <div className="hidden md:block">
                <PortalSidebar />
            </div>

            {/* Main content area */}
            <SidebarInset className="pb-20 md:pb-0">
                <div className="flex flex-1 flex-col gap-4">
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
                    <header className="hidden md:flex h-14 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
                        <div className="flex items-center gap-2">
                            <SidebarTrigger className="-ml-1" />
                            {breadcrumbs.length > 0 && (
                                <nav className="flex items-center gap-1 text-sm text-muted-foreground">
                                    {breadcrumbs.map((crumb, i) => (
                                        <span key={i} className="flex items-center gap-1">
                                            {i > 0 && <span className="text-muted-foreground/50">/</span>}
                                            {crumb.href ? (
                                                <Link href={crumb.href} className="hover:text-foreground transition-colors">
                                                    {crumb.title}
                                                </Link>
                                            ) : (
                                                <span className="text-foreground font-medium">{crumb.title}</span>
                                            )}
                                        </span>
                                    ))}
                                </nav>
                            )}
                        </div>
                    </header>

                    {/* Page content */}
                    <div className="flex flex-1 flex-col gap-4 p-4">
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

            {/* Right sidebar (desktop only) */}
            <PortalSidebarRight />

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
                    <div className="space-y-1 px-4 pb-6">
                        {mobileNavItems.map((item) => {
                            const Icon = item.icon;
                            const label = t(item.label);
                            const isActive = currentPath === item.href || (item.href !== mobileNavItems[0].href && currentPath.startsWith(item.href));

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMobilePanelOpen(false)}
                                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                                        isActive
                                            ? 'bg-accent font-medium text-accent-foreground'
                                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                    }`}
                                >
                                    <Icon className="size-4" />
                                    {label}
                                </Link>
                            );
                        })}
                    </div>
                </DrawerContent>
            </Drawer>

            {/* Mobile bottom nav */}
            <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:hidden">
                <div className="flex items-center justify-around">
                    {mobileNavItems.slice(0, 4).map((item) => {
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center py-3 text-xs ${
                                    currentPath === item.href || currentPath.startsWith(item.href + '/')
                                        ? 'text-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Icon className="h-5 w-5" />
                            </Link>
                        );
                    })}
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
        </SidebarProvider>
    );
}
