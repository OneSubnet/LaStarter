import { Head, router, useForm, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    ArrowUpDown,
    ImageIcon,
    Pencil,
    PlusCircle,
    Trash2,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Guard from '@/components/guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { store as productsStore, update as productsUpdate, destroy as productsDestroy } from '@/routes/ai/products';
import DataTable from '../../../../components/data-table';
import type { Product } from '@/types/ailes-invisibles';

type Props = { products: Product[] };

const defaultFormData = {
    name: '',
    description: '',
    type: 'service',
    price: '',
    unit: 'unit',
    category: '',
    sku: '',
    reference: '',
    stock: '',
    stock_alert: '',
    tax_rate: '20',
    is_active: true,
    image: null as File | null,
};

export default function Index({ products }: Props) {
    const { t } = useTranslation();
    const teamSlug = (usePage().props.currentTeam as { slug: string } | undefined)?.slug ?? '';
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const form = useForm({ ...defaultFormData, image: null as File | null });

    const editForm = useForm({ ...defaultFormData, image: null as File | null });

    const startEdit = (product: Product) => {
        setEditingProduct(product);
        editForm.setData({
            name: product.name,
            description: product.description ?? '',
            type: product.type,
            price: String(product.price),
            unit: product.unit,
            category: product.category ?? '',
            sku: product.sku ?? '',
            reference: product.reference ?? '',
            stock: product.stock != null ? String(product.stock) : '',
            stock_alert: product.stock_alert != null ? String(product.stock_alert) : '',
            tax_rate: String(product.tax_rate),
            is_active: product.is_active,
            image: null,
        });
        setEditOpen(true);
    };

    const submitCreate = (e: FormEvent) => {
        e.preventDefault();
        form.post(productsStore(teamSlug).url, {
            forceFormData: true,
            onSuccess: () => {
                setOpen(false);
                form.reset();
            },
        });
    };

    const submitEdit = (e: FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;
        editForm.post(productsUpdate({ current_team: teamSlug, product: editingProduct.id }).url, {
            forceFormData: true,
            onSuccess: () => {
                setEditOpen(false);
                setEditingProduct(null);
                editForm.reset();
            },
        });
    };

    const columnLabels: Record<string, string> = {
        name: t('ai.catalog.name'),
        image_url: t('ai.catalog.image'),
        type: t('ai.catalog.type'),
        price: t('ai.catalog.price'),
        tax_rate: t('ai.catalog.tax'),
        reference: t('ai.catalog.reference'),
        sku: t('ai.catalog.sku'),
        stock: t('ai.catalog.stock'),
        category: t('ai.catalog.category'),
        is_active: t('ai.catalog.status'),
    };

    const columns = useMemo<ColumnDef<Product, unknown>[]>(
        () => [
            {
                accessorKey: 'image_url',
                header: '',
                cell: ({ row }) => (
                    <div className="flex size-10 items-center justify-center overflow-hidden rounded-md bg-muted">
                        {row.original.image_url ? (
                            <img src={row.original.image_url} alt={row.original.name} className="size-full object-cover" />
                        ) : (
                            <ImageIcon className="size-4 text-muted-foreground" />
                        )}
                    </div>
                ),
                enableHiding: false,
            },
            {
                accessorKey: 'name',
                header: ({ column }) => (
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                        {t('ai.catalog.name')} <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div>
                        <span className="font-medium">{row.original.name}</span>
                        {row.original.reference && (
                            <div className="text-xs text-muted-foreground">{row.original.reference}</div>
                        )}
                    </div>
                ),
                enableHiding: false,
            },
            {
                accessorKey: 'type',
                header: t('ai.catalog.type'),
                cell: ({ row }) => (
                    <Badge variant="outline">{row.original.type === 'service' ? t('ai.catalog.service') : t('ai.catalog.product_type')}</Badge>
                ),
            },
            {
                accessorKey: 'price',
                header: ({ column }) => (
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                        {t('ai.catalog.price')} <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) =>
                    new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' }).format(row.original.price),
            },
            {
                accessorKey: 'stock',
                header: ({ column }) => (
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                        {t('ai.catalog.stock')} <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => {
                    const stock = row.original.stock;
                    const alert = row.original.stock_alert;
                    if (stock == null) return <span className="text-muted-foreground">-</span>;
                    const isLow = alert != null && stock <= alert;
                    return (
                        <Badge className={isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                                {stock}{isLow ? ` - ${t('ai.status.low_stock')}` : ''}
                            </Badge>
                    );
                },
            },
            {
                accessorKey: 'category',
                header: t('ai.catalog.category'),
                cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.category ?? '-'}</span>,
            },
            {
                accessorKey: 'is_active',
                header: t('ai.catalog.status'),
                cell: ({ row }) => (
                    <Badge className={row.original.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                        {row.original.is_active ? t('ai.catalog.active') : t('ai.catalog.inactive')}
                    </Badge>
                ),
            },
            {
                id: 'actions',
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-1">
                        <Guard permission="ai.product.update">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="size-8" onClick={() => startEdit(row.original)}>
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">{t('ai.catalog.edit')}</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t('ai.catalog.edit')}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </Guard>
                        <Guard permission="ai.product.delete">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => router.delete(productsDestroy({ current_team: teamSlug, product: row.original.id }).url)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">{t('ai.catalog.delete')}</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t('ai.catalog.delete')}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </Guard>
                    </div>
                ),
                enableHiding: false,
            },
        ],
        [teamSlug],
    );

    const productFormFields = (formHook: typeof form, showImage = true) => (
        <div className="max-h-[65vh] space-y-5 overflow-y-auto px-1">
            {showImage && (
                <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('ai.catalog.image')}</Label>
                    <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => formHook.setData('image', (e.target.files?.[0] ?? null) as unknown as File | null)}
                        className="cursor-pointer"
                    />
                </div>
            )}
            <div className="space-y-2">
                <Label className="text-sm font-medium">{t('ai.catalog.name')} *</Label>
                <Input value={formHook.data.name} onChange={(e) => formHook.setData('name', e.target.value)} required placeholder={t('ai.catalog.name_placeholder')} />
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-medium">{t('ai.catalog.description')}</Label>
                <Input value={formHook.data.description} onChange={(e) => formHook.setData('description', e.target.value)} placeholder={t('ai.catalog.description_placeholder')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('ai.catalog.type')}</Label>
                    <Select value={formHook.data.type} onValueChange={(v) => formHook.setData('type', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="service">{t('ai.catalog.service')}</SelectItem>
                            <SelectItem value="product">{t('ai.catalog.product_type')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('ai.catalog.price')} *</Label>
                    <Input type="number" step="0.01" value={formHook.data.price} onChange={(e) => formHook.setData('price', e.target.value)} required placeholder="0.00" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('ai.catalog.reference')}</Label>
                    <Input value={formHook.data.reference} onChange={(e) => formHook.setData('reference', e.target.value)} placeholder="REF-001" />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('ai.catalog.sku')}</Label>
                    <Input value={formHook.data.sku} onChange={(e) => formHook.setData('sku', e.target.value)} placeholder="SKU-001" />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('ai.catalog.unit')}</Label>
                    <Select value={formHook.data.unit} onValueChange={(v) => formHook.setData('unit', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="unit">{t('ai.catalog.unit_unit')}</SelectItem>
                            <SelectItem value="hour">{t('ai.catalog.unit_hour')}</SelectItem>
                            <SelectItem value="day">{t('ai.catalog.unit_day')}</SelectItem>
                            <SelectItem value="month">{t('ai.catalog.unit_month')}</SelectItem>
                            <SelectItem value="session">{t('ai.catalog.unit_session')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('ai.catalog.stock')}</Label>
                    <Input type="number" value={formHook.data.stock} onChange={(e) => formHook.setData('stock', e.target.value)} placeholder={t('ai.catalog.unlimited')} />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('ai.catalog.stock_alert')}</Label>
                    <Input type="number" value={formHook.data.stock_alert} onChange={(e) => formHook.setData('stock_alert', e.target.value)} placeholder="5" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('ai.catalog.category')}</Label>
                    <Input value={formHook.data.category} onChange={(e) => formHook.setData('category', e.target.value)} placeholder={t('ai.catalog.category_placeholder')} />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('ai.catalog.tax_rate')} (%)</Label>
                    <Input type="number" step="0.01" value={formHook.data.tax_rate} onChange={(e) => formHook.setData('tax_rate', e.target.value)} />
                </div>
            </div>
        </div>
    );

    const toolbarSlot = (
        <Guard permission="ai.product.create">
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t('ai.catalog.new')}
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t('ai.catalog.new_product')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitCreate} className="space-y-5">
                        {productFormFields(form)}
                        <div className="pt-2">
                            <Button type="submit" className="w-full" disabled={form.processing}>{t('ai.catalog.create')}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </Guard>
    );

    return (
        <AppLayout breadcrumbs={[{ title: t('ai.catalog.breadcrumb') }]}>
            <Head title={t('ai.catalog.breadcrumb')} />

            <div className="space-y-6">
                <DataTable
                    columns={columns}
                    data={products}
                    getRowId={(row) => row.id.toString()}
                    searchPlaceholder={t('ai.catalog.search')}
                    emptyMessage={t('ai.catalog.no_products')}
                    emptyIcon={ImageIcon}
                    toolbarSlot={toolbarSlot}
                    columnLabels={columnLabels}
                />

                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{t('ai.catalog.edit_product')}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={submitEdit} className="space-y-5">
                            {productFormFields(editForm)}
                            <div className="pt-2">
                                <Button type="submit" className="w-full" disabled={editForm.processing}>{t('ai.catalog.save')}</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
