import { Head } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Download } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import DataTable from '../../../components/data-table';
import PortalLayout from '../../../layouts/portal/portal-layout';
import { usePortalUrl } from '../../../hooks/use-portal-url';
import type { PortalQuote as Quote } from '@/types/ailes-invisibles';
import { portalQuoteStatusConfig as statusConfig, formatCurrency } from '@/types/ailes-invisibles';

type Props = { quotes: Quote[] };

export default function Quotes({ quotes }: Props) {
    const { t } = useTranslation();
    const fmt = formatCurrency;
    const p = usePortalUrl();

    const columns = useMemo<ColumnDef<Quote, unknown>[]>(
        () => [
            {
                accessorKey: 'quote_number',
                header: ({ column }) => (
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                        {t('ai.quotes.number')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => <span className="font-medium">{row.original.quote_number}</span>,
            },
            {
                accessorKey: 'subject',
                header: t('ai.quotes.subject'),
                cell: ({ row }) => row.original.subject ?? '—',
            },
            {
                accessorKey: 'total',
                header: ({ column }) => (
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                        {t('ai.quotes.total_ttc')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => <span className="font-medium">{fmt(row.original.total)}</span>,
            },
            {
                accessorKey: 'valid_until',
                header: ({ column }) => (
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                        {t('ai.quotes.valid_until')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <span className="text-sm text-muted-foreground">
                        {row.original.valid_until ? new Date(row.original.valid_until).toLocaleDateString() : '—'}
                    </span>
                ),
            },
            {
                accessorKey: 'status',
                header: t('ai.quotes.status'),
                cell: ({ row }) => {
                    const config = statusConfig[row.original.status];
                    return config ? (
                        <Badge className={config.className}>{t(config.label)}</Badge>
                    ) : (
                        <Badge variant="outline">{row.original.status}</Badge>
                    );
                },
            },
            {
                id: 'actions',
                cell: ({ row }) => {
                    if (!row.original.has_file) return null;
                    return (
                        <div className="flex justify-end">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <a href={p(`/quotes/${row.original.id}/download`)}>
                                            <Button variant="ghost" size="icon" className="size-8">
                                                <Download className="h-4 w-4" />
                                                <span className="sr-only">{t('ai.quotes.download')}</span>
                                            </Button>
                                        </a>
                                    </TooltipTrigger>
                                    <TooltipContent>{t('ai.quotes.download')}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    );
                },
                enableHiding: false,
            },
        ],
        [t, p, fmt],
    );

    return (
        <PortalLayout breadcrumbs={[{ title: t('ai.portal.quotes') }]}>
            <Head title={t('ai.portal.quotes_title')} />

            <DataTable
                columns={columns}
                data={quotes ?? []}
                getRowId={(row) => row.id.toString()}
                searchPlaceholder={t('ai.quotes.search')}
                emptyMessage={t('ai.quotes.no_results')}
                columnLabels={{
                    quote_number: t('ai.quotes.number'),
                    subject: t('ai.quotes.subject'),
                    total: t('ai.quotes.total_ttc'),
                    valid_until: t('ai.quotes.valid_until'),
                    status: t('ai.quotes.status'),
                }}
            />
        </PortalLayout>
    );
}
