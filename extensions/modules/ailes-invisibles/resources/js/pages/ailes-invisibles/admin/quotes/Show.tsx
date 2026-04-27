import { Head, router, usePage } from '@inertiajs/react';
import {
    FileText,
    Send,
    Trash2,
    User,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Guard from '@/components/guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { index as quotesIndex, show as quotesShow, destroy as quotesDestroy, send as quotesSend, accept as quotesAccept, convert as quotesConvert } from '@/routes/ai/quotes';
import { show as eventsShow } from '@/routes/ai/events';
import type { Quote } from '@/types/ailes-invisibles';
import { quoteStatusConfig as statusConfig, formatCurrency } from '@/types/ailes-invisibles';

type Props = {
    quote: Quote;
};

const fmt = formatCurrency;

export default function Show({ quote }: Props) {
    const { t } = useTranslation();
    const teamSlug = (usePage().props.currentTeam as { slug: string } | undefined)?.slug ?? '';
    const statusCfg = statusConfig[quote.status] ?? { label: quote.status, className: '' };

    return (
        <AppLayout breadcrumbs={[{ title: t('ai.quotes.breadcrumb'), href: quotesIndex({ current_team: teamSlug }).url }, { title: quote.quote_number }]}>
            <Head title={`${t('ai.quotes.breadcrumb')} ${quote.quote_number}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                            {t('ai.quotes.show.created_on')}{' '}
                            {new Date(quote.created_at).toLocaleDateString(undefined, {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}
                        </p>
                    </div>
                    <Badge className={statusCfg.className}>{t(statusCfg.label)}</Badge>

                    <div className="flex items-center gap-2">
                        {quote.status === 'draft' && (
                            <Guard permission="ai.quote.send">
                                <Button
                                    size="sm"
                                    onClick={() =>
                                        router.post(
                                            quotesSend({ current_team: teamSlug, quote: quote.id }).url,
                                        )
                                    }
                                >
                                    <Send className="mr-1 h-4 w-4" />
                                    {t('ai.quotes.show.send')}
                                </Button>
                            </Guard>
                        )}

                        {quote.status === 'sent' && (
                            <Guard permission="ai.quote.update">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        router.post(
                                            quotesAccept({ current_team: teamSlug, quote: quote.id }).url,
                                        )
                                    }
                                >
                                    {t('ai.quotes.show.accept')}
                                </Button>
                            </Guard>
                        )}

                        {quote.status === 'accepted' && !quote.has_invoice && (
                            <Guard permission="ai.invoice.create">
                                <Button
                                    size="sm"
                                    onClick={() =>
                                        router.post(
                                            quotesConvert({ current_team: teamSlug, quote: quote.id }).url,
                                        )
                                    }
                                >
                                    <FileText className="mr-1 h-4 w-4" />
                                    {t('ai.quotes.show.convert_to_invoice')}
                                </Button>
                            </Guard>
                        )}

                        <Guard permission="ai.quote.delete">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() =>
                                    router.delete(
                                        quotesDestroy({ current_team: teamSlug, quote: quote.id }).url,
                                    )
                                }
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </Guard>
                    </div>
                </div>

                {/* Quote Info Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">{t('ai.quotes.show.client')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            {quote.client ? (
                                <>
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">
                                            {quote.client.first_name}{' '}
                                            {quote.client.last_name}
                                        </span>
                                    </div>
                                    {quote.client.company_name && (
                                        <p className="text-muted-foreground">
                                            {quote.client.company_name}
                                        </p>
                                    )}
                                    <p className="text-muted-foreground">
                                        {quote.client.email}
                                    </p>
                                    {quote.client.address_line1 && (
                                        <p className="text-muted-foreground">
                                            {quote.client.address_line1}
                                            {quote.client.address_line2 &&
                                                `, ${quote.client.address_line2}`}
                                            <br />
                                            {quote.client.postal_code}{' '}
                                            {quote.client.city},{' '}
                                            {quote.client.country}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className="text-muted-foreground">
                                    {t('ai.quotes.show.no_client')}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">{t('ai.quotes.show.details')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            {quote.subject && (
                                <div>
                                    <span className="text-muted-foreground">
                                        {t('ai.quotes.show.subject')}:
                                    </span>{' '}
                                    {quote.subject}
                                </div>
                            )}
                            <div>
                                <span className="text-muted-foreground">
                                    {t('ai.quotes.show.validity')}:
                                </span>{' '}
                                {quote.valid_until
                                    ? new Date(quote.valid_until).toLocaleDateString()
                                    : t('ai.quotes.show.no_limit')}
                            </div>
                            {quote.event && (
                                <div>
                                    <span className="text-muted-foreground">
                                        {t('ai.quotes.show.event')}:
                                    </span>{' '}
                                    <a
                                        href={eventsShow({ current_team: teamSlug, event: quote.event.id }).url}
                                        className="hover:underline"
                                    >
                                        {quote.event.title}
                                    </a>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">{t('ai.quotes.show.notes')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                {quote.notes ?? t('ai.quotes.show.no_notes')}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Lines Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">{t('ai.quotes.show.lines')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('ai.quotes.show.description')}</TableHead>
                                    <TableHead className="text-right">
                                        {t('ai.quotes.show.quantity')}
                                    </TableHead>
                                    <TableHead className="text-right">
                                        {t('ai.quotes.show.unit_price')}
                                    </TableHead>
                                    <TableHead className="text-right">
                                        {t('ai.quotes.show.tax')}
                                    </TableHead>
                                    <TableHead className="text-right">
                                        {t('ai.quotes.show.total_ht')}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(quote.lines ?? []).length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            {t('ai.quotes.show.no_lines')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    (quote.lines ?? [])
                                        .sort(
                                            (a, b) =>
                                                a.sort_order - b.sort_order,
                                        )
                                        .map((line) => (
                                            <TableRow key={line.id}>
                                                <TableCell>
                                                    <span className="font-medium">
                                                        {line.description}
                                                    </span>
                                                    {line.product && (
                                                        <span className="ml-2 text-xs text-muted-foreground">
                                                            ({line.product.name})
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {line.quantity}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {fmt(line.unit_price)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {line.tax_rate}%
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {fmt(line.line_total)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Total Summary */}
                <div className="flex justify-end">
                    <Card className="w-80">
                        <CardContent className="space-y-2 p-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    {t('ai.quotes.show.subtotal_ht')}
                                </span>
                                <span>{fmt(quote.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('ai.quotes.show.tax')}</span>
                                <span>{fmt(quote.tax_amount)}</span>
                            </div>
                            <hr />
                            <div className="flex justify-between text-base font-bold">
                                <span>{t('ai.quotes.show.total_ttc')}</span>
                                <span>{fmt(quote.total)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
