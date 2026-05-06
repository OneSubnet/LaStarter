import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { SharedData } from '@/types';

export default function Dashboard() {
    const { t } = useTranslation();
    const page = usePage<SharedData>();
    const teamSlug = page.props.currentTeam?.slug ?? '';

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: t('dashboard.breadcrumb'),
                    href: teamSlug ? dashboard(teamSlug).url : '/',
                },
            ]}
        >
            <Head title={t('dashboard.title')} />
            <div className="flex min-h-[60vh] items-center justify-center">
                <p className="text-muted-foreground">
                    {t('dashboard.welcome')}
                </p>
            </div>
        </AppLayout>
    );
}
