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
import type { PortalInvoice as Invoice } from '@/types/ailes-invisibles';
import { portalInvoiceStatusConfig as statusConfig, formatCurrency } from '@/types/ailes-invisibles';

type Props = { invoices: Invoice[] };

export default function Invoices({ invoices }: Props) {
    const { t } = useTranslation();
    const fmt = formatCurrency;
    const p = usePortalUrl();

    const columns = useMemo<ColumnDef<Invoice, unknown>[]>(
        () => [
            {
                accessorKey: 'invoice_number',
                header: ({ column }) => (
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                        {t('ai.invoices.number')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => <span className="font-medium">{row.original.invoice_number}</span>,
            },
            {
                accessorKey: 'issue_date',
                header: ({ column }) => (
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                        {t('ai.invoices.issue_date')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.issue_date ? new Date(row.original.issue_date).toLocaleDateString() : '—'}</span>,
            },
            {
                accessorKey: 'due_date',
                header: ({ column }) => (
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                        {t('ai.invoices.due_date')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => {
                    const isOverdue = row.original.status !== 'paid' && row.original.status !== 'cancelled' && new Date(row.original.due_date) < new Date();
                    return (
                        <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                            {new Date(row.original.due_date).toLocaleDateString()}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'total',
                header: ({ column }) => (
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                        {t('ai.invoices.total_ttc')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => <span className="font-medium">{fmt(row.original.total)}</span>,
            },
            {
                accessorKey: 'paid_amount',
                header: t('ai.invoices.paid'),
                cell: ({ row }) => <span>{fmt(row.original.paid_amount)}</span>,
            },
            {
                accessorKey: 'status',
                header: t('ai.invoices.status'),
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
                                        <a href={p(`/invoices/${row.original.id}/download`)}>
                                            <Button variant="ghost" size="icon" className="size-8">
                                                <Download className="h-4 w-4" />
                                                <span className="sr-only">{t('ai.invoices.download')}</span>
                                            </Button>
                                        </a>
                                    </TooltipTrigger>
                                    <TooltipContent>{t('ai.invoices.download')}</TooltipContent>
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
        <PortalLayout breadcrumbs={[{ title: t('ai.portal.invoices') }]}>
            <Head title={t('ai.portal.invoices_title')} />

            <DataTable
                columns={columns}
                data={invoices ?? []}
                getRowId={(row) => row.id.toString()}
                searchPlaceholder={t('ai.invoices.search')}
                emptyMessage={t('ai.invoices.no_results')}
                columnLabels={{
                    invoice_number: t('ai.invoices.number'),
                    issue_date: t('ai.invoices.issue_date'),
                    due_date: t('ai.invoices.due_date'),
                    total: t('ai.invoices.total_ttc'),
                    paid_amount: t('ai.invoices.paid'),
                    status: t('ai.invoices.status'),
                }}
            />
        </PortalLayout>
    );
}
