import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    ArrowUpDown,
    Mail,
    Pencil,
    PlusCircle,
    RefreshCw,
    Trash2,
    Users,
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
import { store as clientsStore, show as clientsShow, update as clientsUpdate, destroy as clientsDestroy, invite as clientsInvite } from '@/routes/ai/clients';
import DataTable from '../../../../components/data-table';
import type { Client } from '@/types/ailes-invisibles';
import { clientStatusConfig as statusConfig, clientTypeConfig as typeConfig } from '@/types/ailes-invisibles';

type Props = { clients: Client[] };

export default function Index({ clients }: Props) {
    const { t } = useTranslation();
    const teamSlug = (usePage().props.currentTeam as { slug: string } | undefined)?.slug ?? '';
    const [open, setOpen] = useState(false);

    const form = useForm({
        type: 'individual' as string,
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company_name: '',
        vat_number: '',
        vat_country: 'FR',
        country: 'FR',
    });

    const [editOpen, setEditOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const editForm = useForm({
        type: 'individual' as string,
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company_name: '',
        vat_number: '',
        vat_country: 'FR',
        country: 'FR',
    });

    const openEdit = (client: Client) => {
        setEditingId(client.id);
        editForm.setData({
            type: client.type,
            first_name: client.first_name,
            last_name: client.last_name,
            email: client.email,
            phone: client.phone ?? '',
            company_name: client.company_name ?? '',
            vat_number: client.vat_number ?? '',
            vat_country: 'FR',
            country: client.country ?? 'FR',
        });
        setEditOpen(true);
    };

    const submitEdit = (e: FormEvent) => {
        e.preventDefault();
        if (!editingId) return;
        editForm.put(clientsUpdate({ current_team: teamSlug, client: editingId }).url, {
            onSuccess: () => {
                setEditOpen(false);
                setEditingId(null);
            },
        });
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(clientsStore(teamSlug).url, {
            onSuccess: () => {
                setOpen(false);
                form.reset();
            },
        });
    };

    const columns = useMemo<ColumnDef<Client, unknown>[]>(
        () => [
            {
                accessorKey: 'first_name',
                header: ({ column }) => (
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                        {t('ai.clients.name')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div>
                        <Link href={clientsShow({ current_team: teamSlug, client: row.original.id }).url} className="font-medium hover:underline">
                            {row.original.first_name} {row.original.last_name}
                        </Link>
                        {row.original.company_name && (
                            <div className="text-xs text-muted-foreground">{row.original.company_name}</div>
                        )}
                    </div>
                ),
                enableHiding: false,
                accessorFn: (row) => `${row.first_name} ${row.last_name}`,
            },
            {
                accessorKey: 'email',
                header: ({ column }) => (
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                        {t('ai.clients.email')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => <span className="text-sm">{row.original.email}</span>,
            },
            {
                accessorKey: 'type',
                header: t('ai.clients.type'),
                cell: ({ row }) => {
                    const config = typeConfig[row.original.type];
                    return config ? (
                        <Badge className={config.className}>{t(config.label)}</Badge>
                    ) : (
                        <Badge variant="outline">{row.original.type}</Badge>
                    );
                },
            },
            {
                accessorKey: 'country',
                header: t('ai.clients.country'),
                cell: ({ row }) => <span className="text-sm">{row.original.country}</span>,
            },
            {
                accessorKey: 'status',
                header: t('ai.clients.status'),
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
                accessorKey: 'quotes_count',
                header: ({ column }) => (
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                        {t('ai.clients.quotes')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.quotes_count}</span>,
            },
            {
                accessorKey: 'invoices_count',
                header: ({ column }) => (
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                        {t('ai.clients.invoices')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.invoices_count}</span>,
            },
            {
                id: 'actions',
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-1">
                        <Guard permission="ai.client.create">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 text-muted-foreground hover:text-foreground"
                                            onClick={() => router.post(clientsInvite({ current_team: teamSlug, client: row.original.id }).url)}
                                        >
                                            {row.original.has_portal ? <RefreshCw className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                                            <span className="sr-only">
                                                {row.original.has_portal ? t('ai.clients.resend_invite') : t('ai.clients.invite')}
                                            </span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {row.original.has_portal ? t('ai.clients.resend_portal') : t('ai.clients.invite_portal')}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </Guard>
                        <Guard permission="ai.client.update">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(row.original)}>
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">{t('ai.clients.edit')}</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t('ai.clients.edit_client')}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </Guard>
                        <Guard permission="ai.client.delete">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => router.delete(clientsDestroy({ current_team: teamSlug, client: row.original.id }).url)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">{t('ai.clients.delete')}</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t('ai.clients.delete_client')}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </Guard>
                    </div>
                ),
                enableHiding: false,
            },
        ],
        [teamSlug, t],
    );

    const toolbarSlot = (
        <Guard permission="ai.client.create">
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t('ai.clients.new')}
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t('ai.clients.new')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <Label>{t('ai.clients.type')}</Label>
                            <Select value={form.data.type} onValueChange={(v) => form.setData('type', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="individual">{t('ai.clients.individual')}</SelectItem>
                                    <SelectItem value="pro">{t('ai.clients.professional')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="first_name">{t('ai.clients.first_name')}</Label>
                                <Input id="first_name" value={form.data.first_name} onChange={(e) => form.setData('first_name', e.target.value)} required />
                            </div>
                            <div>
                                <Label htmlFor="last_name">{t('ai.clients.last_name')}</Label>
                                <Input id="last_name" value={form.data.last_name} onChange={(e) => form.setData('last_name', e.target.value)} required />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="email">{t('ai.clients.email')}</Label>
                            <Input id="email" type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} required />
                        </div>
                        <div>
                            <Label htmlFor="phone">{t('ai.clients.phone')}</Label>
                            <Input id="phone" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} />
                        </div>
                        {form.data.type === 'pro' && (
                            <>
                                <div>
                                    <Label htmlFor="company_name">{t('ai.clients.company')}</Label>
                                    <Input id="company_name" value={form.data.company_name} onChange={(e) => form.setData('company_name', e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="vat_number">{t('ai.clients.vat_number')}</Label>
                                        <Input id="vat_number" value={form.data.vat_number} onChange={(e) => form.setData('vat_number', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label>{t('ai.clients.vat_country')}</Label>
                                        <Select value={form.data.vat_country} onValueChange={(v) => form.setData('vat_country', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="FR">{t('ai.clients.country_fr')}</SelectItem>
                                                <SelectItem value="BE">{t('ai.clients.country_be')}</SelectItem>
                                                <SelectItem value="DE">{t('ai.clients.country_de')}</SelectItem>
                                                <SelectItem value="IT">{t('ai.clients.country_it')}</SelectItem>
                                                <SelectItem value="ES">{t('ai.clients.country_es')}</SelectItem>
                                                <SelectItem value="LU">{t('ai.clients.country_lu')}</SelectItem>
                                                <SelectItem value="CH">{t('ai.clients.country_ch')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </>
                        )}
                        <Button type="submit" className="w-full" disabled={form.processing}>
                            {t('ai.clients.create')}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </Guard>
    );

    return (
        <AppLayout breadcrumbs={[{ title: t('ai.clients.breadcrumb') }]}>
            <Head title={t('ai.clients.breadcrumb')} />

            <div className="space-y-6">
                <DataTable
                    columns={columns}
                    data={clients}
                    getRowId={(row) => row.id.toString()}
                    searchPlaceholder={t('ai.clients.search')}
                    emptyMessage={t('ai.clients.no_clients')}
                    emptyIcon={Users}
                    toolbarSlot={toolbarSlot}
                    columnLabels={{
                        first_name: t('ai.clients.name'),
                        email: t('ai.clients.email'),
                        type: t('ai.clients.type'),
                        country: t('ai.clients.country'),
                        status: t('ai.clients.status'),
                        quotes_count: t('ai.clients.quotes'),
                        invoices_count: t('ai.clients.invoices'),
                        portal: t('ai.clients.portal'),
                    }}
                />
            </div>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t('ai.clients.edit_client')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-4">
                        <div>
                            <Label>{t('ai.clients.type')}</Label>
                            <Select value={editForm.data.type} onValueChange={(v) => editForm.setData('type', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="individual">{t('ai.clients.individual')}</SelectItem>
                                    <SelectItem value="pro">{t('ai.clients.professional')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>{t('ai.clients.first_name')}</Label>
                                <Input value={editForm.data.first_name} onChange={(e) => editForm.setData('first_name', e.target.value)} required />
                            </div>
                            <div>
                                <Label>{t('ai.clients.last_name')}</Label>
                                <Input value={editForm.data.last_name} onChange={(e) => editForm.setData('last_name', e.target.value)} required />
                            </div>
                        </div>
                        <div>
                            <Label>{t('ai.clients.email')}</Label>
                            <Input type="email" value={editForm.data.email} onChange={(e) => editForm.setData('email', e.target.value)} required />
                        </div>
                        <div>
                            <Label>{t('ai.clients.phone')}</Label>
                            <Input value={editForm.data.phone} onChange={(e) => editForm.setData('phone', e.target.value)} />
                        </div>
                        {editForm.data.type === 'pro' && (
                            <>
                                <div>
                                    <Label>{t('ai.clients.company')}</Label>
                                    <Input value={editForm.data.company_name} onChange={(e) => editForm.setData('company_name', e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>{t('ai.clients.vat_number')}</Label>
                                        <Input value={editForm.data.vat_number} onChange={(e) => editForm.setData('vat_number', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label>{t('ai.clients.vat_country')}</Label>
                                        <Select value={editForm.data.vat_country} onValueChange={(v) => editForm.setData('vat_country', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="FR">{t('ai.clients.country_fr')}</SelectItem>
                                                <SelectItem value="BE">{t('ai.clients.country_be')}</SelectItem>
                                                <SelectItem value="DE">{t('ai.clients.country_de')}</SelectItem>
                                                <SelectItem value="IT">{t('ai.clients.country_it')}</SelectItem>
                                                <SelectItem value="ES">{t('ai.clients.country_es')}</SelectItem>
                                                <SelectItem value="LU">{t('ai.clients.country_lu')}</SelectItem>
                                                <SelectItem value="CH">{t('ai.clients.country_ch')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </>
                        )}
                        <Button type="submit" className="w-full" disabled={editForm.processing}>
                            {t('ai.clients.save')}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
