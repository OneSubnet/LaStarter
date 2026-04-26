import { Head, router, useForm, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    FolderOpen,
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
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { store as categoriesStore, update as categoriesUpdate, destroy as categoriesDestroy } from '@/routes/ai/categories';
import DataTable from '../../../../components/data-table';
import type { Category } from '@/types/ailes-invisibles';

type Props = { categories: Category[] };

const defaultFormData = {
    name: '',
    description: '',
    is_active: true as boolean,
};

export default function Index({ categories }: Props) {
    const { t } = useTranslation();
    const teamSlug = (usePage().props.currentTeam as { slug: string } | undefined)?.slug ?? '';
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

    const form = useForm({ ...defaultFormData });

    const editForm = useForm({ ...defaultFormData });

    const startEdit = (category: Category) => {
        setEditingCategory(category);
        editForm.setData({
            name: category.name,
            description: category.description ?? '',
            is_active: category.is_active,
        });
        setEditOpen(true);
    };

    const confirmDelete = (category: Category) => {
        setDeletingCategory(category);
        setDeleteOpen(true);
    };

    const submitCreate = (e: FormEvent) => {
        e.preventDefault();
        form.post(categoriesStore(teamSlug).url, {
            onSuccess: () => {
                setOpen(false);
                form.reset();
            },
        });
    };

    const submitEdit = (e: FormEvent) => {
        e.preventDefault();
        if (!editingCategory) return;
        editForm.put(categoriesUpdate({ current_team: teamSlug, category: editingCategory.id }).url, {
            onSuccess: () => {
                setEditOpen(false);
                setEditingCategory(null);
                editForm.reset();
            },
        });
    };

    const submitDelete = () => {
        if (!deletingCategory) return;
        router.delete(categoriesDestroy({ current_team: teamSlug, category: deletingCategory.id }).url, {
            onSuccess: () => {
                setDeleteOpen(false);
                setDeletingCategory(null);
            },
        });
    };

    const columnLabels: Record<string, string> = {
        name: t('ai.categories.name'),
        products_count: t('ai.categories.products_count'),
        is_active: t('ai.categories.is_active'),
        sort_order: t('ai.categories.sort_order'),
    };

    const columns = useMemo<ColumnDef<Category, unknown>[]>(
        () => [
            {
                accessorKey: 'name',
                header: ({ column }) => (
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                        {t('ai.categories.name')} <span className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div>
                        <span className="font-medium">{row.original.name}</span>
                        {row.original.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1">{row.original.description}</div>
                        )}
                    </div>
                ),
                enableHiding: false,
            },
            {
                accessorKey: 'products_count',
                header: t('ai.categories.products_count'),
                cell: ({ row }) => (
                    <Badge variant="outline">{row.original.products_count}</Badge>
                ),
            },
            {
                accessorKey: 'is_active',
                header: t('ai.categories.is_active'),
                cell: ({ row }) => (
                    <Badge className={row.original.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'}>
                        {row.original.is_active ? t('ai.categories.active') : t('ai.categories.inactive')}
                    </Badge>
                ),
            },
            {
                accessorKey: 'sort_order',
                header: t('ai.categories.sort_order'),
                cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.sort_order}</span>,
            },
            {
                id: 'actions',
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-1">
                        <Guard permission="ai.category.update">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="size-8" onClick={() => startEdit(row.original)}>
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">{t('ai.categories.edit')}</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t('ai.categories.edit')}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </Guard>
                        <Guard permission="ai.category.delete">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => confirmDelete(row.original)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">{t('ai.categories.delete')}</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t('ai.categories.delete')}</TooltipContent>
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

    const categoryFormFields = (formHook: typeof form) => (
        <div className="space-y-5 px-1">
            <div className="space-y-2">
                <Label className="text-sm font-medium">{t('ai.categories.name')} *</Label>
                <Input value={formHook.data.name} onChange={(e) => formHook.setData('name', e.target.value)} required placeholder={t('ai.categories.name_placeholder')} />
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-medium">{t('ai.categories.description')}</Label>
                <Input value={formHook.data.description} onChange={(e) => formHook.setData('description', e.target.value)} placeholder={t('ai.categories.description_placeholder')} />
            </div>
            <div className="flex items-center gap-3">
                <Switch checked={formHook.data.is_active} onCheckedChange={(checked) => formHook.setData('is_active', checked)} />
                <Label className="text-sm font-medium">{t('ai.categories.is_active')}</Label>
            </div>
        </div>
    );

    const toolbarSlot = (
        <Guard permission="ai.category.create">
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t('ai.categories.new')}
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t('ai.categories.create')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitCreate} className="space-y-5">
                        {categoryFormFields(form)}
                        <div className="pt-2">
                            <Button type="submit" className="w-full" disabled={form.processing}>{t('ai.categories.save')}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </Guard>
    );

    return (
        <AppLayout breadcrumbs={[{ title: t('ai.categories.breadcrumb') }]}>
            <Head title={t('ai.categories.title')} />

            <div className="space-y-6">
                <DataTable
                    columns={columns}
                    data={categories}
                    getRowId={(row) => row.id.toString()}
                    searchPlaceholder={t('ai.categories.search')}
                    emptyMessage={t('ai.categories.no_categories')}
                    emptyIcon={FolderOpen}
                    toolbarSlot={toolbarSlot}
                    columnLabels={columnLabels}
                />

                {/* Edit Dialog */}
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{t('ai.categories.edit_category')}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={submitEdit} className="space-y-5">
                            {categoryFormFields(editForm)}
                            <div className="pt-2">
                                <Button type="submit" className="w-full" disabled={editForm.processing}>{t('ai.categories.save')}</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>{t('ai.categories.delete_title')}</DialogTitle>
                            <DialogDescription>{t('ai.categories.delete_confirm')}</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('ai.categories.cancel')}</Button>
                            <Button variant="destructive" onClick={submitDelete}>{t('ai.categories.delete')}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
