import { useTranslation } from 'react-i18next';
import { Head, router } from '@inertiajs/react';
import { Paintbrush, Check } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Theme {
    identifier: string;
    name: string;
    description: string | null;
    version: string;
    author: string | null;
    is_active: boolean;
}

interface Props {
    themes: Theme[];
    activeTheme: string | null;
}

export default function ThemeSettings({ themes, activeTheme }: Props) {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('settings.theme.title', 'Theme'), href: '/settings/theme' },
    ];

    const activateTheme = (identifier: string) => {
        router.put(
            '/settings/theme',
            { theme: identifier },
            { preserveScroll: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('settings.theme.title', 'Theme')} />

            <div className="space-y-6 p-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t('settings.theme.title', 'Theme')}</h2>
                    <p className="text-muted-foreground">{t('settings.theme.description', 'Choose the visual theme for your workspace.')}</p>
                </div>

                {themes.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center">
                        <Paintbrush className="mx-auto h-10 w-10 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">{t('settings.theme.no_themes', 'No themes available.')}</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {themes.map((theme) => (
                            <button
                                key={theme.identifier}
                                onClick={() => activateTheme(theme.identifier)}
                                className={`relative rounded-lg border p-6 text-left transition-all hover:shadow-md ${
                                    activeTheme === theme.identifier
                                        ? 'border-blue-500 ring-2 ring-blue-500'
                                        : 'border-gray-200 dark:border-gray-700'
                                }`}
                            >
                                {activeTheme === theme.identifier && (
                                    <div className="absolute right-3 top-3 rounded-full bg-blue-500 p-1">
                                        <Check className="h-3 w-3 text-white" />
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
                                        <Paintbrush className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{theme.name}</h3>
                                        {theme.author && <p className="text-sm text-muted-foreground">{theme.author}</p>}
                                    </div>
                                </div>
                                {theme.description && <p className="mt-3 text-sm text-muted-foreground">{theme.description}</p>}
                                <p className="mt-2 text-xs text-muted-foreground">v{theme.version}</p>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
