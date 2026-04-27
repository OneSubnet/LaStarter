import { useTranslation } from 'react-i18next';
import { Link } from '@inertiajs/react';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
    const { t } = useTranslation();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
            <div className="text-center">
                <FileQuestion className="mx-auto h-20 w-20 text-gray-400" />
                <h1 className="mt-6 text-6xl font-bold text-gray-900 dark:text-gray-100">404</h1>
                <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
                    {t('errors.page_not_found')}
                </p>
                <p className="mt-2 text-gray-500 dark:text-gray-500">
                    {t('errors.page_not_found_desc')}
                </p>
                <Link
                    href="/"
                    className="mt-8 inline-flex items-center rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
                >
                    {t('errors.go_home')}
                </Link>
            </div>
        </div>
    );
}
