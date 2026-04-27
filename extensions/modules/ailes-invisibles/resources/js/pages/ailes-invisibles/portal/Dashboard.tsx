import { Head, Link } from '@inertiajs/react';
import { FileText, MessageCircle, Receipt, ClipboardList } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PortalLayout from '../../../layouts/portal/portal-layout';
import { usePortalUrl } from '../../../hooks/use-portal-url';
import type { PortalClient } from '@/types/ailes-invisibles';
import { formatCurrency } from '@/types/ailes-invisibles';

type Props = {
    client: Pick<PortalClient, 'first_name' | 'last_name' | 'company_name'>;
    documentsCount: number;
    invoicesCount: number;
    unpaidTotal: number;
    quotesCount: number;
    unreadMessages: number;
};

export default function Dashboard({ client, documentsCount, invoicesCount, unpaidTotal, quotesCount, unreadMessages }: Props) {
    const { t } = useTranslation();
    const p = usePortalUrl();

    return (
        <PortalLayout breadcrumbs={[{ title: t('ai.portal.dashboard') }]}>
            <Head title={t('ai.portal.dashboard_title')} />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">
                        {t('ai.portal.dashboard_title')} {client.first_name} {client.last_name}
                    </h1>
                    {client.company_name && <p className="text-muted-foreground">{client.company_name}</p>}
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('ai.portal.my_documents')}</CardTitle>
                            <FileText className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{documentsCount}</div>
                            <Link href={p('/documents')} className="text-xs text-blue-600 hover:underline">{t('ai.portal.view_documents')}</Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('ai.portal.my_invoices')}</CardTitle>
                            <Receipt className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{invoicesCount}</div>
                            <Link href={p('/invoices')} className="text-xs text-green-600 hover:underline">{t('ai.portal.view_invoices')}</Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('ai.portal.my_quotes')}</CardTitle>
                            <ClipboardList className="h-4 w-4 text-indigo-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{quotesCount}</div>
                            <Link href={p('/quotes')} className="text-xs text-indigo-600 hover:underline">{t('ai.portal.view_quotes')}</Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('ai.portal.my_messages')}</CardTitle>
                            <MessageCircle className="h-4 w-4 text-pink-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{unreadMessages}</div>
                            <Link href={p('/chat')} className="text-xs text-pink-600 hover:underline">{t('ai.portal.view_messages')}</Link>
                        </CardContent>
                    </Card>
                </div>

                {unpaidTotal > 0 && (
                    <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                        <CardHeader>
                            <CardTitle className="text-red-700">{t('ai.portal.amount_due')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-700">
                                {formatCurrency(unpaidTotal)}
                            </div>
                            <Link href={p('/invoices')}>
                                <Button variant="outline" className="mt-2">{t('ai.portal.view_invoices')}</Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>
        </PortalLayout>
    );
}
