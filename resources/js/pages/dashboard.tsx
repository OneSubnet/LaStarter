import { Head, usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import {
    useContainerWidth,
    useResponsiveLayout,
    GridLayout,
} from 'react-grid-layout';
import { useTranslation } from 'react-i18next';
import 'react-grid-layout/css/styles.css';
import 'react-grid-layout/css/react-resizable.css';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';

export default function Dashboard() {
    const { t } = useTranslation();
    const page = usePage();
    const teamSlug =
        (page.props.currentTeam as { slug: string } | undefined)?.slug ?? '';
    const { width, containerRef, mounted } = useContainerWidth();

    const layouts = useMemo(() => ({ lg: [] }), []);

    const { layout, cols } = useResponsiveLayout({
        width,
        layouts,
        breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
        cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
    });

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
            <div ref={containerRef} className="min-h-[60vh]">
                {mounted && layout.length > 0 && (
                    <GridLayout
                        width={width}
                        gridConfig={{ cols }}
                        layout={layout}
                    >
                        {layout.map((item) => (
                            <div key={item.i} />
                        ))}
                    </GridLayout>
                )}
            </div>
        </AppLayout>
    );
}
