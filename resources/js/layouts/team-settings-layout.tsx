import { usePage } from '@inertiajs/react';
import Heading from '@/components/heading';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import type { BreadcrumbItem } from '@/types';

export default function TeamSettingsLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    activeTab?: string;
    wide?: boolean;
    children: React.ReactNode;
}) {
    const { currentTeam } = usePage().props;
    const teamName =
        (currentTeam as { name?: string } | null)?.name ?? 'Team';

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <div className="px-6 py-6">
                <Heading
                    title={`${teamName} settings`}
                    description="Manage your team settings"
                />
                <div className="mt-6 space-y-6">
                    {children}
                </div>
            </div>
        </AppSidebarLayout>
    );
}
