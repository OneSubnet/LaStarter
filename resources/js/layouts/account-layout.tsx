import { Link } from '@inertiajs/react';
import { Palette, Shield, User } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { cn } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editProfile } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { BreadcrumbItem } from '@/types';

type AccountTab = {
    title: string;
    href: string;
    icon: React.ElementType;
};

export default function AccountLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    activeTab?: string;
    children: React.ReactNode;
}) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    const tabs: AccountTab[] = [
        { title: 'Profile', href: editProfile().url, icon: User },
        { title: 'Security', href: editSecurity().url, icon: Shield },
        {
            title: 'Appearance',
            href: editAppearance().url,
            icon: Palette,
        },
    ];

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            <div className="px-4 py-6">
                <Heading
                    title="Account"
                    description="Manage your account settings"
                />

                <div className="flex flex-col lg:flex-row lg:space-x-12">
                    <aside className="w-full max-w-xl lg:w-48">
                        <nav
                            className="flex flex-col space-y-1 space-x-0"
                            aria-label="Account settings"
                        >
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

                    <div className="flex-1 md:max-w-2xl">
                        <section className="max-w-xl space-y-12">
                            {children}
                        </section>
                    </div>
                </div>
            </div>
        </AppLayoutTemplate>
    );
}
