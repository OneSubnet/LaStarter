import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
    const { currentTeam } = usePage().props;
    const teamName =
        (currentTeam as { name?: string } | null)?.name ?? t('common.team');

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <div className="px-6 py-6">
                <Heading
                    title={`${teamName} ${t('common.settings').toLowerCase()}`}
                    description={t('layouts.team_settings.description')}
                />
                <div className="mt-6 space-y-6">
                    {children}
                </div>
            </div>
        </AppSidebarLayout>
    );
}
