import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Mail, Receipt, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { index as clientsIndex } from '@/routes/ai/clients';
import type { Client, QuoteSummary, InvoiceSummary } from '@/types/ailes-invisibles';
import { clientStatusConfig as statusConfig, formatCurrency } from '@/types/ailes-invisibles';

type ClientInvoice = InvoiceSummary & { paid_amount: number };

type Props = {
    client: Client;
    quotes: QuoteSummary[];
    invoices: ClientInvoice[];
    documentsCount: number;
};

export default function Show({ client, quotes, invoices, documentsCount }: Props) {
    const { t } = useTranslation();
    const teamSlug = (usePage().props.currentTeam as { slug: string } | undefined)?.slug ?? '';
    const fmt = formatCurrency;

    return (
        <AppLayout>
            <Head title={`${client.first_name} ${client.last_name}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href={clientsIndex(teamSlug).url}>
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">{client.first_name} {client.last_name}</h1>
                        {client.company_name && <p className="text-muted-foreground">{client.company_name}</p>}
                    </div>
                    <Badge className={client.type === 'pro' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}>
                        {client.type === 'pro' ? t('ai.clients.professional') : t('ai.clients.individual')}
                    </Badge>
                    <Badge className={statusConfig[client.status]?.className}>{t(statusConfig[client.status]?.label ?? '')}</Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader><CardTitle className="text-sm">{t('ai.clients.information')}</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {client.email}</div>
                            {client.phone && <div>{t('ai.clients.phone')}: {client.phone}</div>}
                            <div>{t('ai.clients.country')}: {client.country}</div>
                            {client.vat_number && <div>{t('ai.clients.vat_number')}: {client.vat_number} ({client.vat_country})</div>}
                            {client.address_line1 && <div>{client.address_line1}, {client.postal_code} {client.city}</div>}
                            <div className="pt-2">
                                {t('ai.clients.portal')}: {client.has_portal ? (
                                    <Badge className="bg-green-100 text-green-700">{t('ai.status.active')}</Badge>
                                ) : (
                                    <Badge className="bg-gray-100 text-gray-700">{t('ai.status.not_invited')}</Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-sm">{t('ai.clients.summary')}</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold">{(quotes ?? []).length}</div>
                                <div className="text-xs text-muted-foreground">{t('ai.clients.quotes')}</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{(invoices ?? []).length}</div>
                                <div className="text-xs text-muted-foreground">{t('ai.clients.invoices')}</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{documentsCount}</div>
                                <div className="text-xs text-muted-foreground">{t('ai.clients.documents')}</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> {t('ai.clients.quotes')}</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('ai.clients.number')}</TableHead>
                                    <TableHead>{t('ai.clients.total_ttc')}</TableHead>
                                    <TableHead>{t('ai.clients.status')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(quotes ?? []).map((q) => (
                                    <TableRow key={q.id}>
                                        <TableCell className="font-medium">{q.quote_number}</TableCell>
                                        <TableCell>{fmt(q.total)}</TableCell>
                                        <TableCell><Badge className={statusConfig[q.status]?.className}>{t(statusConfig[q.status]?.label ?? '')}</Badge></TableCell>
                                    </TableRow>
                                ))}
                                {(quotes ?? []).length === 0 && (
                                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-4">{t('ai.clients.no_quotes')}</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Receipt className="h-4 w-4" /> {t('ai.clients.invoices')}</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('ai.clients.number')}</TableHead>
                                    <TableHead>{t('ai.clients.total_ttc')}</TableHead>
                                    <TableHead>{t('ai.clients.paid')}</TableHead>
                                    <TableHead>{t('ai.clients.status')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(invoices ?? []).map((inv) => (
                                    <TableRow key={inv.id}>
                                        <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                                        <TableCell>{fmt(inv.total)}</TableCell>
                                        <TableCell>{fmt(inv.paid_amount)}</TableCell>
                                        <TableCell><Badge className={statusConfig[inv.status]?.className}>{t(statusConfig[inv.status]?.label ?? '')}</Badge></TableCell>
                                    </TableRow>
                                ))}
                                {(invoices ?? []).length === 0 && (
                                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">{t('ai.clients.no_invoices')}</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
