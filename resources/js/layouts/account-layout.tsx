import Heading from '@/components/heading';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import type { BreadcrumbItem } from '@/types';

export default function AccountLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    activeTab?: string;
    children: React.ReactNode;
}) {
    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <div className="px-4 py-6">
                <Heading
                    title="Account"
                    description="Manage your account settings"
                />
                <div className="mt-6 max-w-xl space-y-12">
                    {children}
                </div>
            </div>
        </AppSidebarLayout>
    );
}
