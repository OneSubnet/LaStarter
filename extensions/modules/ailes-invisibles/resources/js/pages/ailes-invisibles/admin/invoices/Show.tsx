import { Head, useForm, usePage } from '@inertiajs/react';
import {
    Banknote,
    CreditCard,
    Send,
    XCircle,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Guard from '@/components/guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { index as invoicesIndex, payment as invoicesPayment, send as invoicesSend, cancel as invoicesCancel } from '@/routes/ai/invoices';
import type { Invoice, InvoiceLine, Payment } from '@/types/ailes-invisibles';
import { invoiceStatusConfig as statusConfig, paymentMethodLabels as methodLabels, formatCurrency } from '@/types/ailes-invisibles';

type Props = {
    invoice: Invoice;
    lines: InvoiceLine[];
    payments: Payment[];
};

export default function Show({ invoice, lines, payments }: Props) {
    const { t } = useTranslation();
    const teamSlug = (usePage().props.currentTeam as { slug: string } | undefined)?.slug ?? '';
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

    const fmt = formatCurrency;

    const remaining = invoice.total - invoice.paid_amount;

    const paymentForm = useForm({
        amount: remaining > 0 ? remaining.toFixed(2) : '',
        method: 'transfer' as string,
        paid_at: new Date().toISOString().split('T')[0],
        reference: '',
        notes: '',
    });

    const submitPayment = (e: FormEvent) => {
        e.preventDefault();
        paymentForm.post(
            invoicesPayment({ current_team: teamSlug, invoice: invoice.id }).url,
            {
                onSuccess: () => {
                    setPaymentDialogOpen(false);
                    paymentForm.reset();
                },
            },
        );
    };

    const handleSend = () => {
        router.post(
            invoicesSend({ current_team: teamSlug, invoice: invoice.id }).url,
        );
    };

    const handleCancel = () => {
        router.post(
            invoicesCancel({ current_team: teamSlug, invoice: invoice.id }).url,
        );
    };

    const statusInfo = statusConfig[invoice.status] ?? { label: invoice.status, className: '' };

    return (
        <AppLayout breadcrumbs={[{ title: t('ai.invoices.breadcrumb'), href: invoicesIndex({ current_team: teamSlug }).url }, { title: invoice.invoice_number }]}>
            <Head title={`${t('ai.invoices.breadcrumb')} ${invoice.invoice_number}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <p className="text-muted-foreground">{invoice.client_name}</p>
                        </div>
                        <Badge className={statusInfo.className}>{t(statusInfo.label)}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        {invoice.status === 'draft' && (
                            <Guard permission="ai.invoice.update">
                                <Button variant="outline" onClick={handleSend}>
                                    <Send className="mr-2 h-4 w-4" />
                                    {t('ai.invoices.send')}
                                </Button>
                            </Guard>
                        )}
                        {!['paid', 'cancelled'].includes(invoice.status) && (
                            <Guard permission="ai.invoice.update">
                                <Button variant="outline" onClick={handleCancel} className="text-destructive hover:text-destructive">
                                    <XCircle className="mr-2 h-4 w-4" />
                                    {t('ai.invoices.cancel')}
                                </Button>
                            </Guard>
                        )}
                    </div>
                </div>

                {/* Invoice info */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">{t('ai.invoices.issue_date')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-medium">
                                {new Date(invoice.issue_date).toLocaleDateString()}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">{t('ai.invoices.due_date')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-lg font-medium ${invoice.status === 'overdue' ? 'text-red-600' : ''}`}>
                                {new Date(invoice.due_date).toLocaleDateString()}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">{t('ai.invoices.remaining')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-lg font-bold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {fmt(remaining)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Lines */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">{t('ai.invoices.lines')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('ai.quotes.description')}</TableHead>
                                    <TableHead className="text-right">{t('ai.catalog.quantity')}</TableHead>
                                    <TableHead className="text-right">{t('ai.quotes.unit_price')}</TableHead>
                                    <TableHead>{t('ai.catalog.tax_rate')}</TableHead>
                                    <TableHead className="text-right">{t('ai.quotes.line_total')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(lines ?? []).map((line) => (
                                    <TableRow key={line.id}>
                                        <TableCell className="font-medium">{line.description}</TableCell>
                                        <TableCell className="text-right">{line.quantity}</TableCell>
                                        <TableCell className="text-right">{fmt(line.unit_price)}</TableCell>
                                        <TableCell className="text-right">{line.tax_rate}%</TableCell>
                                        <TableCell className="text-right font-medium">{fmt(line.line_total)}</TableCell>
                                    </TableRow>
                                ))}
                                {(lines ?? []).length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                                            {t('ai.quotes.no_quotes')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Totals */}
                <div className="flex justify-end">
                    <div className="w-full max-w-sm space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{t('ai.invoices.subtotal')}</span>
                            <span>{fmt(invoice.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{t('ai.invoices.tax_amount')}</span>
                            <span>{fmt(invoice.tax_total)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium border-t pt-2">
                            <span>{t('ai.invoices.total')}</span>
                            <span>{fmt(invoice.total)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{t('ai.invoices.paid_amount')}</span>
                            <span className="text-green-600">{fmt(invoice.paid_amount)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold border-t pt-2">
                            <span>{t('ai.invoices.remaining')}</span>
                            <span className={remaining > 0 ? 'text-red-600' : 'text-green-600'}>
                                {fmt(remaining)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Payments */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            {t('ai.invoices.payments')}
                        </CardTitle>
                        {remaining > 0 && (
                            <Guard permission="ai.invoice.update">
                                <Button size="sm" onClick={() => setPaymentDialogOpen(true)}>
                                    <Banknote className="mr-2 h-4 w-4" />
                                    {t('ai.invoices.record_payment')}
                                </Button>
                            </Guard>
                        )}
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('ai.invoices.amount')}</TableHead>
                                    <TableHead>{t('ai.invoices.method')}</TableHead>
                                    <TableHead>{t('ai.invoices.paid_at')}</TableHead>
                                    <TableHead>{t('ai.invoices.reference')}</TableHead>
                                    <TableHead>{t('ai.invoices.notes')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(payments ?? []).map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell className="font-medium">{fmt(payment.amount)}</TableCell>
                                        <TableCell>{t(methodLabels[payment.method] ?? payment.method)}</TableCell>
                                        <TableCell>{new Date(payment.paid_at).toLocaleDateString()}</TableCell>
                                        <TableCell>{payment.reference ?? '-'}</TableCell>
                                        <TableCell className="text-muted-foreground">{payment.notes ?? '-'}</TableCell>
                                    </TableRow>
                                ))}
                                {(payments ?? []).length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                                            {t('ai.invoices.no_invoices')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {invoice.notes && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">{t('ai.invoices.notes')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Record Payment Dialog */}
            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('ai.invoices.record_payment')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitPayment} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="payment-amount">{t('ai.invoices.amount')}</Label>
                            <Input
                                id="payment-amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={remaining.toFixed(2)}
                                value={paymentForm.data.amount}
                                onChange={(e) => paymentForm.setData('amount', e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>{t('ai.invoices.method')}</Label>
                            <Select value={paymentForm.data.method} onValueChange={(v) => paymentForm.setData('method', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="card">{t('ai.invoices.method_card')}</SelectItem>
                                    <SelectItem value="transfer">{t('ai.invoices.method_transfer')}</SelectItem>
                                    <SelectItem value="cheque">{t('ai.invoices.method_cheque')}</SelectItem>
                                    <SelectItem value="cash">{t('ai.invoices.method_cash')}</SelectItem>
                                    <SelectItem value="online">{t('ai.invoices.method_online')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="paid_at">{t('ai.invoices.paid_at')}</Label>
                            <Input
                                id="paid_at"
                                type="date"
                                value={paymentForm.data.paid_at}
                                onChange={(e) => paymentForm.setData('paid_at', e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="payment-reference">{t('ai.invoices.reference')}</Label>
                            <Input
                                id="payment-reference"
                                value={paymentForm.data.reference}
                                onChange={(e) => paymentForm.setData('reference', e.target.value)}
                                placeholder={t('ai.invoices.show.reference_placeholder')}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="payment-notes">{t('ai.invoices.notes')}</Label>
                            <textarea
                                id="payment-notes"
                                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={paymentForm.data.notes}
                                onChange={(e) => paymentForm.setData('notes', e.target.value)}
                                placeholder={t('ai.invoices.show.notes_placeholder')}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                                {t('common.cancel')}
                            </Button>
                            <Button type="submit" disabled={paymentForm.processing}>
                                {t('common.save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
