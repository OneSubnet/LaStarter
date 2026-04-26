import { Head, router, usePage } from '@inertiajs/react';
import {
    Calendar,
    FileText,
    MapPin,
    Receipt,
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
import { index as eventsIndex, destroy as eventsDestroy } from '@/routes/ai/events';
import type { Event } from '@/types/ailes-invisibles';
import { eventStatusConfig as statusConfig, eventTypeConfig as typeConfig, quoteStatusConfig, invoiceStatusConfig, formatCurrency } from '@/types/ailes-invisibles';

type Props = {
    event: Event;
};

const fmt = formatCurrency;

export default function Show({ event }: Props) {
    const { t } = useTranslation();
    const teamSlug = (usePage().props.currentTeam as { slug: string } | undefined)?.slug ?? '';
    const statusCfg = statusConfig[event.status] ?? { label: event.status, className: '' };
    const typeCfg = typeConfig[event.type] ?? { label: event.type, className: '' };

    return (
        <AppLayout breadcrumbs={[{ title: t('ai.events.breadcrumb'), href: eventsIndex(teamSlug).url }, { title: event.title }]}>
            <Head title={event.title} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                            {t('ai.events.show.created_on')}{' '}
                            {new Date(event.created_at).toLocaleDateString(undefined, {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}
                        </p>
                    </div>
                    <Badge className={typeCfg.className}>{t(typeCfg.label)}</Badge>
                    <Badge className={statusCfg.className}>{t(statusCfg.label)}</Badge>
                    <Guard permission="ai.event.delete">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() =>
                                router.delete(
                                    eventsDestroy({ current_team: teamSlug, event: event.id }).url,
                                )
                            }
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </Guard>
                </div>

                {/* Event Details */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">{t('ai.events.show.information')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            {event.client && (
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                        {event.client.first_name}{' '}
                                        {event.client.last_name}
                                        {event.client.company_name && (
                                            <span className="text-muted-foreground">
                                                {' '}
                                                ({event.client.company_name})
                                            </span>
                                        )}
                                    </span>
                                </div>
                            )}
                            {event.start_date && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                        {t('ai.events.show.start')}:{' '}
                                        {new Date(event.start_date).toLocaleString(undefined, {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </div>
                            )}
                            {event.end_date && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                        {t('ai.events.show.end')}:{' '}
                                        {new Date(event.end_date).toLocaleString(undefined, {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </div>
                            )}
                            {event.location && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{event.location}</span>
                                </div>
                            )}
                            {event.description && (
                                <div className="mt-3 rounded-md bg-muted/50 p-3">
                                    <p className="text-muted-foreground">
                                        {event.description}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">{t('ai.events.show.summary')}</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold">
                                    {(event.quotes ?? []).length}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {t('ai.events.show.quotes')}
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    {(event.invoices ?? []).length}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {t('ai.events.show.invoices')}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Linked Quotes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <FileText className="h-4 w-4" /> {t('ai.events.show.linked_quotes')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('ai.events.show.number')}</TableHead>
                                    <TableHead>{t('ai.events.show.total_ttc')}</TableHead>
                                    <TableHead>{t('ai.events.show.status')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(event.quotes ?? []).length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={3}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            {t('ai.events.show.no_quotes')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    (event.quotes ?? []).map((q) => {
                                        const qCfg = quoteStatusConfig[q.status] ?? {
                                            label: q.status,
                                            className: '',
                                        };
                                        return (
                                            <TableRow key={q.id}>
                                                <TableCell className="font-medium">
                                                    {q.quote_number}
                                                </TableCell>
                                                <TableCell>{fmt(q.total)}</TableCell>
                                                <TableCell>
                                                    <Badge className={qCfg.className}>
                                                        {t(qCfg.label)}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Linked Invoices */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Receipt className="h-4 w-4" /> {t('ai.events.show.linked_invoices')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('ai.events.show.number')}</TableHead>
                                    <TableHead>{t('ai.events.show.total_ttc')}</TableHead>
                                    <TableHead>{t('ai.events.show.status')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(event.invoices ?? []).length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={3}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            {t('ai.events.show.no_invoices')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    (event.invoices ?? []).map((inv) => {
                                        const iCfg = invoiceStatusConfig[inv.status] ?? {
                                            label: inv.status,
                                            className: '',
                                        };
                                        return (
                                            <TableRow key={inv.id}>
                                                <TableCell className="font-medium">
                                                    {inv.invoice_number}
                                                </TableCell>
                                                <TableCell>{fmt(inv.total)}</TableCell>
                                                <TableCell>
                                                    <Badge className={iCfg.className}>
                                                        {t(iCfg.label)}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
