import type { ReactNode } from 'react';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { BreadcrumbItem } from '@/types';

export default function AppLayout({
    breadcrumbs = [],
    headerActions,
    rightSidebar,
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    headerActions?: ReactNode;
    rightSidebar?: ReactNode;
    children: ReactNode;
}) {
    return (
        <AppLayoutTemplate
            breadcrumbs={breadcrumbs}
            headerActions={headerActions}
            rightSidebar={rightSidebar}
        >
            {children}
        </AppLayoutTemplate>
    );
}
