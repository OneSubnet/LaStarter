import { Head, Link, useForm, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Eye, Plus, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Guard from '@/components/guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { store as invoicesStore, show as invoicesShow, destroy as invoicesDestroy } from '@/routes/ai/invoices';
import type { Invoice, ClientSummary } from '@/types/ailes-invisibles';
import { invoiceStatusConfig as statusConfig, formatCurrency } from '@/types/ailes-invisibles';
import DataTable from '../../../../components/data-table';

type ClientPick = Pick<ClientSummary, 'id' | 'first_name' | 'last_name'>;

type Props = {
    invoices: Invoice[];
    clients: ClientPick[];
};

export default function Index({ invoices, clients }: Props) {
    const { t } = useTranslation();
    const teamSlug = (usePage().props.currentTeam as { slug: string } | undefined)?.slug ?? '';

    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    const form = useForm<{
        client_id: string;
        issue_date: string;
        due_date: string;
        subtotal: string;
        tax_amount: string;
        total: string;
        notes: string;
        file: File | null;
    }>({
        client_id: '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: '',
        subtotal: '0',
        tax_amount: '0',
        total: '0',
        notes: '',
        file: null,
    });

    const fmt = formatCurrency;

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(invoicesStore({ current_team: teamSlug }).url, {
            onSuccess: () => {
                setCreateDialogOpen(false);
                form.reset();
            },
        });
    };

    const columns = useMemo<ColumnDef<Invoice, unknown>[]>(
        () => [
            {
                accessorKey: 'invoice_number',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        {t('ai.invoices.number')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <Link
                        href={invoicesShow({ current_team: teamSlug, invoice: row.original.id }).url}
                        className="font-medium hover:underline"
                    >
                        {row.original.invoice_number}
                    </Link>
                ),
                enableHiding: false,
            },
            {
                accessorKey: 'client_name',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        {t('ai.invoices.client')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
            },
            {
                accessorKey: 'total',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        {t('ai.invoices.total_ttc')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => <span>{fmt(row.original.total)}</span>,
            },
            {
                accessorKey: 'paid_amount',
                header: t('ai.invoices.paid'),
                cell: ({ row }) => <span>{fmt(row.original.paid_amount)}</span>,
            },
            {
                id: 'remaining',
                header: t('ai.invoices.remaining'),
                cell: ({ row }) => {
                    const remaining = row.original.total - row.original.paid_amount;
                    return (
                        <span className={remaining > 0 ? 'text-red-600 font-medium' : ''}>
                            {fmt(remaining)}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'status',
                header: t('ai.invoices.status'),
                cell: ({ row }) => {
                    const status = row.original.status;
                    const config = statusConfig[status];
                    return config ? (
                        <Badge className={config.className}>{t(config.label)}</Badge>
                    ) : (
                        <Badge variant="outline">{status}</Badge>
                    );
                },
            },
            {
                accessorKey: 'issue_date',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        {t('ai.invoices.issue_date')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <span className="text-sm text-muted-foreground">
                        {row.original.issue_date ? new Date(row.original.issue_date).toLocaleDateString() : '—'}
                    </span>
                ),
            },
            {
                accessorKey: 'due_date',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        {t('ai.invoices.due_date')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => {
                    const isOverdue = row.original.status === 'overdue' ||
                        (row.original.status !== 'paid' && row.original.status !== 'cancelled' && new Date(row.original.due_date) < new Date());
                    return (
                        <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                            {new Date(row.original.due_date).toLocaleDateString()}
                        </span>
                    );
                },
            },
            {
                id: 'actions',
                cell: ({ row }) => {
                    const invoice = row.original;
                    return (
                        <div className="flex items-center justify-end gap-1">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link href={invoicesShow({ current_team: teamSlug, invoice: invoice.id }).url}>
                                            <Button variant="ghost" size="icon" className="size-8">
                                                <Eye className="h-4 w-4" />
                                                <span className="sr-only">{t('ai.invoices.view')}</span>
                                            </Button>
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent>{t('ai.invoices.view_invoice')}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <Guard permission="ai.invoice.delete">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-muted-foreground hover:text-destructive"
                                                onClick={() =>
                                                    router.delete(
                                                        invoicesDestroy({ current_team: teamSlug, invoice: invoice.id }).url,
                                                    )
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">{t('ai.invoices.delete')}</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{t('ai.invoices.delete')}</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </Guard>
                        </div>
                    );
                },
                enableHiding: false,
            },
        ],
        [t, teamSlug, fmt],
    );

    return (
        <AppLayout breadcrumbs={[{ title: t('ai.invoices.breadcrumb') }]}>
            <Head title={t('ai.invoices.breadcrumb')} />

            <DataTable<Invoice>
                columns={columns}
                data={invoices}
                getRowId={(row) => row.id.toString()}
                enableRowSelection
                searchPlaceholder={t('ai.invoices.search')}
                emptyMessage={t('ai.invoices.no_results')}
                columnLabels={{
                    client_name: t('ai.invoices.client'),
                    total: t('ai.invoices.total_ttc'),
                    paid_amount: t('ai.invoices.paid'),
                    remaining: t('ai.invoices.remaining'),
                    status: t('ai.invoices.status'),
                    issue_date: t('ai.invoices.issue_date'),
                    due_date: t('ai.invoices.due_date'),
                }}
                toolbarSlot={
                    <Guard permission="ai.invoice.create">
                        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                            <Plus className="h-4 w-4" />
                            {t('ai.invoices.new')}
                        </Button>
                    </Guard>
                }
            />

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t('ai.invoices.new')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="client_id">{t('ai.invoices.client')}</Label>
                            <Select value={form.data.client_id} onValueChange={(v) => form.setData('client_id', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('ai.invoices.select_client')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {(clients ?? []).map((client) => (
                                        <SelectItem key={client.id} value={client.id.toString()}>
                                            {client.first_name} {client.last_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="file">{t('ai.invoices.pdf_file')}</Label>
                            <Input
                                id="file"
                                type="file"
                                accept=".pdf"
                                onChange={(e) => form.setData('file', e.target.files?.[0] ?? null)}
                                required
                            />
                            {form.errors.file && <p className="text-sm text-destructive">{form.errors.file}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="issue_date">{t('ai.invoices.issue_date_label')}</Label>
                                <Input
                                    id="issue_date"
                                    type="date"
                                    value={form.data.issue_date}
                                    onChange={(e) => form.setData('issue_date', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="due_date">{t('ai.invoices.due_date_label')}</Label>
                                <Input
                                    id="due_date"
                                    type="date"
                                    value={form.data.due_date}
                                    onChange={(e) => form.setData('due_date', e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="subtotal">{t('ai.invoices.subtotal')}</Label>
                                <Input
                                    id="subtotal"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={form.data.subtotal}
                                    onChange={(e) => {
                                        form.setData('subtotal', e.target.value);
                                    }}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="tax_amount">{t('ai.invoices.tax')}</Label>
                                <Input
                                    id="tax_amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={form.data.tax_amount}
                                    onChange={(e) => form.setData('tax_amount', e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="total">{t('ai.invoices.total_ttc')}</Label>
                                <Input
                                    id="total"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={form.data.total}
                                    onChange={(e) => form.setData('total', e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="notes">{t('ai.invoices.notes')}</Label>
                            <textarea
                                id="notes"
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={form.data.notes}
                                onChange={(e) => form.setData('notes', e.target.value)}
                                placeholder={t('ai.invoices.notes_placeholder')}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                {t('ai.invoices.cancel')}
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {t('ai.invoices.create')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
