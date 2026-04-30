import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';

export default function Dashboard() {
    const { t } = useTranslation();
    const page = usePage();
    const teamSlug =
        (page.props.currentTeam as { slug: string } | undefined)?.slug ?? '';

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
        </AppLayout>
    );
}
