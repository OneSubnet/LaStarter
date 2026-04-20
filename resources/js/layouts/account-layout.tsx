import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <div className="px-4 py-6">
                <Heading
                    title={t('layouts.account.title')}
                    description={t('layouts.account.description')}
                />
                <div className="mt-6 max-w-xl space-y-12">
                    {children}
                </div>
            </div>
        </AppSidebarLayout>
    );
}
