import { Head, router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    ArrowUpDown,
    Eye,
    FileText,
    Plus,
    Send,
    Trash2,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Guard from '@/components/guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Textarea } from '@/components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { convert as quotesConvert, destroy as quotesDestroy, send as quotesSend, show as quotesShow, store as quotesStore } from '@/routes/ai/quotes';
import type { Quote } from '@/types/ailes-invisibles';
import { formatCurrency, quoteStatusConfig as statusConfig } from '@/types/ailes-invisibles';
import DataTable from '../../../../components/data-table';

type Props = {
    quotes: Quote[];
    clients: { id: number; first_name: string; last_name: string; company_name: string | null }[];
};

const fmt = formatCurrency;

export default function Index({ quotes, clients }: Props) {
    const { t } = useTranslation();
    const teamSlug = (usePage().props.currentTeam as { slug: string } | undefined)?.slug ?? '';

    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    const fileRef = useRef<HTMLInputElement>(null);
    const [formClientId, setFormClientId] = useState('');
    const [formSubject, setFormSubject] = useState('');
    const [formValidUntil, setFormValidUntil] = useState('');
    const [formSubtotal, setFormSubtotal] = useState('0');
    const [formTaxAmount, setFormTaxAmount] = useState('0');
    const [formTotal, setFormTotal] = useState('0');
    const [formNotes, setFormNotes] = useState('');
    const [formFile, setFormFile] = useState<File | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setFormClientId('');
        setFormSubject('');
        setFormValidUntil('');
        setFormSubtotal('0');
        setFormTaxAmount('0');
        setFormTotal('0');
        setFormNotes('');
        setFormFile(null);
        setFormErrors({});
        setIsSubmitting(false);
        if (fileRef.current) fileRef.current.value = '';
    };

    const handleCreate = () => {
        setIsSubmitting(true);
        setFormErrors({});

        const formData = new FormData();
        formData.append('client_id', formClientId);
        if (formSubject) formData.append('subject', formSubject);
        if (formValidUntil) formData.append('valid_until', formValidUntil);
        formData.append('subtotal', formSubtotal);
        formData.append('tax_amount', formTaxAmount);
        formData.append('total', formTotal);
        if (formNotes) formData.append('notes', formNotes);
        if (formFile) formData.append('file', formFile);

        router.post(
            quotesStore({ current_team: teamSlug }),
            formData,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCreateDialogOpen(false);
                    resetForm();
                },
                onError: (errors) => {
                    setFormErrors(errors);
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleDelete = (quoteId: number) => {
        router.delete(
            quotesDestroy({ current_team: teamSlug, quote: quoteId }),
            {
                onSuccess: () => setDeleteConfirmId(null),
            },
        );
    };

    const handleSend = (quoteId: number) => {
        router.post(
            quotesSend({ current_team: teamSlug, quote: quoteId }),
        );
    };

    const handleConvert = (quoteId: number) => {
        router.post(
            quotesConvert({ current_team: teamSlug, quote: quoteId }),
        );
    };

    const columns = useMemo<ColumnDef<Quote, unknown>[]>(
        () => [
            {
                id: 'select',
                header: ({ table }) => (
                    <div className="flex items-center justify-center">
                        <Checkbox
                            checked={
                                table.getIsAllPageRowsSelected() ||
                                (table.getIsSomePageRowsSelected() && 'indeterminate')
                            }
                            onCheckedChange={(value) =>
                                table.toggleAllPageRowsSelected(!!value)
                            }
                            aria-label={t('ai.quotes.select_all')}
                        />
                    </div>
                ),
                cell: ({ row }) => (
                    <div className="flex items-center justify-center">
                        <Checkbox
                            checked={row.getIsSelected()}
                            onCheckedChange={(value) =>
                                row.toggleSelected(!!value)
                            }
                            aria-label={t('ai.quotes.select_row')}
                        />
                    </div>
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: 'quote_number',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === 'asc')
                        }
                    >
                        {t('ai.quotes.number')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <a
                        href={quotesShow({ current_team: teamSlug, quote: row.original.id }).url}
                        className="font-medium hover:underline"
                    >
                        {row.original.quote_number}
                    </a>
                ),
                enableHiding: false,
            },
            {
                id: 'client_name',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === 'asc')
                        }
                    >
                        {t('ai.quotes.client')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                accessorFn: (row) =>
                    row.client
                        ? `${row.client.first_name} ${row.client.last_name}`
                        : '',
                cell: ({ row }) => {
                    const client = row.original.client;
                    if (!client) return <span className="text-muted-foreground">-</span>;
                    return (
                        <span>
                            {client.first_name} {client.last_name}
                            {client.company_name && (
                                <span className="block text-xs text-muted-foreground">
                                    {client.company_name}
                                </span>
                            )}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'total',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === 'asc')
                        }
                    >
                        {t('ai.quotes.total_ttc')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <span className="font-medium">{fmt(row.original.total)}</span>
                ),
            },
            {
                accessorKey: 'status',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === 'asc')
                        }
                    >
                        {t('ai.quotes.status')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => {
                    const cfg = statusConfig[row.original.status];
                    return cfg ? (
                        <Badge className={cfg.className}>{t(cfg.label)}</Badge>
                    ) : (
                        <Badge variant="outline">{row.original.status}</Badge>
                    );
                },
            },
            {
                accessorKey: 'valid_until',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === 'asc')
                        }
                    >
                        {t('ai.quotes.validity')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <span className="text-sm text-muted-foreground">
                        {row.original.valid_until
                            ? new Date(row.original.valid_until).toLocaleDateString()
                            : '-'}
                    </span>
                ),
            },
            {
                accessorKey: 'created_at',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === 'asc')
                        }
                    >
                        {t('ai.quotes.date')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <span className="text-sm text-muted-foreground">
                        {row.original.created_at ? new Date(row.original.created_at).toLocaleDateString() : '—'}
                    </span>
                ),
            },
            {
                id: 'actions',
                cell: ({ row }) => {
                    const quote = row.original;

                    return (
                        <div className="flex items-center justify-end">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8"
                                            onClick={() =>
                                                router.visit(
                                                    quotesShow({ current_team: teamSlug, quote: quote.id }).url,
                                                )
                                            }
                                        >
                                            <Eye className="h-4 w-4" />
                                            <span className="sr-only">{t('ai.quotes.view')}</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t('ai.quotes.view_quote')}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            {quote.status === 'draft' && (
                                <Guard permission="ai.quote.send">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-muted-foreground hover:text-blue-600"
                                                    onClick={() => handleSend(quote.id)}
                                                >
                                                    <Send className="h-4 w-4" />
                                                    <span className="sr-only">{t('ai.quotes.send')}</span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{t('ai.quotes.send_quote')}</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </Guard>
                            )}

                            {quote.status === 'accepted' && (
                                <Guard permission="ai.invoice.create">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-muted-foreground hover:text-green-600"
                                                    onClick={() => handleConvert(quote.id)}
                                                >
                                                    <FileText className="h-4 w-4" />
                                                    <span className="sr-only">{t('ai.quotes.convert_to_invoice')}</span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{t('ai.quotes.convert_to_invoice')}</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </Guard>
                            )}

                            <Guard permission="ai.quote.delete">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => setDeleteConfirmId(quote.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">{t('ai.quotes.delete')}</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{t('ai.quotes.delete')}</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </Guard>
                        </div>
                    );
                },
                enableHiding: false,
            },
        ],
        [],
    );

    return (
        <AppLayout breadcrumbs={[{ title: t('ai.quotes.breadcrumb') }]}>
            <Head title={t('ai.quotes.breadcrumb')} />

            <div className="space-y-6">
                <DataTable<Quote>
                    columns={columns}
                    data={quotes}
                    getRowId={(row) => row.id.toString()}
                    enableRowSelection
                    searchPlaceholder={t('ai.quotes.search')}
                    emptyMessage={t('ai.quotes.no_quotes')}
                    emptyIcon={FileText}
                    columnLabels={{
                        quote_number: t('ai.quotes.number'),
                        client_name: t('ai.quotes.client'),
                        total: t('ai.quotes.total_ttc'),
                        status: t('ai.quotes.status'),
                        valid_until: t('ai.quotes.validity'),
                        created_at: t('ai.quotes.date'),
                    }}
                    toolbarSlot={
                        <Guard permission="ai.quote.create">
                            <Button
                                size="sm"
                                onClick={() => {
                                    resetForm();
                                    setCreateDialogOpen(true);
                                }}
                            >
                                <Plus className="h-4 w-4" />
                                {t('ai.quotes.new')}
                            </Button>
                        </Guard>
                    }
                />
            </div>

            {/* Create Quote Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t('ai.quotes.new')}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label>{t('ai.quotes.client')}</Label>
                            <Select value={formClientId} onValueChange={setFormClientId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('ai.quotes.select_client')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.first_name} {c.last_name}
                                            {c.company_name ? ` (${c.company_name})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {formErrors.client_id && (
                                <p className="text-sm text-destructive">{formErrors.client_id}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="quote-file">{t('ai.quotes.pdf_file')}</Label>
                            <Input
                                id="quote-file"
                                ref={fileRef}
                                type="file"
                                accept=".pdf"
                                onChange={(e) => setFormFile(e.target.files?.[0] ?? null)}
                            />
                            {formErrors.file && (
                                <p className="text-sm text-destructive">{formErrors.file}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="quote-subject">{t('ai.quotes.subject')}</Label>
                            <Input
                                id="quote-subject"
                                value={formSubject}
                                onChange={(e) => setFormSubject(e.target.value)}
                                placeholder={t('ai.quotes.subject_placeholder')}
                                autoFocus
                            />
                            {formErrors.subject && (
                                <p className="text-sm text-destructive">{formErrors.subject}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="quote-valid-until">{t('ai.quotes.valid_until')}</Label>
                            <Input
                                id="quote-valid-until"
                                type="date"
                                value={formValidUntil}
                                onChange={(e) => setFormValidUntil(e.target.value)}
                            />
                            {formErrors.valid_until && (
                                <p className="text-sm text-destructive">{formErrors.valid_until}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="quote-subtotal">{t('ai.quotes.subtotal')}</Label>
                                <Input
                                    id="quote-subtotal"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formSubtotal}
                                    onChange={(e) => setFormSubtotal(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="quote-tax">{t('ai.quotes.tax')}</Label>
                                <Input
                                    id="quote-tax"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formTaxAmount}
                                    onChange={(e) => setFormTaxAmount(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="quote-total">{t('ai.quotes.total_ttc')}</Label>
                                <Input
                                    id="quote-total"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formTotal}
                                    onChange={(e) => setFormTotal(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="quote-notes">{t('ai.quotes.notes')}</Label>
                            <Textarea
                                id="quote-notes"
                                value={formNotes}
                                onChange={(e) => setFormNotes(e.target.value)}
                                placeholder={t('ai.quotes.notes_placeholder')}
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setCreateDialogOpen(false)}
                        >
                            {t('ai.quotes.cancel')}
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? t('ai.quotes.creating') : t('ai.quotes.create')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog
                open={deleteConfirmId !== null}
                onOpenChange={() => setDeleteConfirmId(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('ai.quotes.delete_title')}</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        {t('ai.quotes.delete_confirm')}
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteConfirmId(null)}
                        >
                            {t('ai.quotes.cancel')}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (deleteConfirmId) {
                                    handleDelete(deleteConfirmId);
                                }
                            }}
                        >
                            {t('ai.quotes.delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
