import { Head, router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    ArrowUpDown,
    Calendar,
    Eye,
    Play,
    Plus,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import EventStepper from './EventStepper';
import DataTable from '../../../../components/data-table';
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
import { store as eventsStore, show as eventsShow, destroy as eventsDestroy } from '@/routes/ai/events';
import type { Event } from '@/types/ailes-invisibles';
import { eventStatusConfig as statusConfig, eventTypeConfig as typeConfig } from '@/types/ailes-invisibles';

type ClientPick = {
    id: number;
    first_name: string;
    last_name: string;
    company_name: string | null;
    type: string;
};

type Props = {
    events: Event[];
    clients: ClientPick[];
};

export default function Index({ events, clients }: Props) {
    const { t } = useTranslation();
    const teamSlug = (usePage().props.currentTeam as { slug: string } | undefined)?.slug ?? '';

    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [stepperOpen, setStepperOpen] = useState(false);

    const [formTitle, setFormTitle] = useState('');
    const [formType, setFormType] = useState('service');
    const [formStartDate, setFormStartDate] = useState('');
    const [formEndDate, setFormEndDate] = useState('');
    const [formLocation, setFormLocation] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setFormTitle('');
        setFormType('service');
        setFormStartDate('');
        setFormEndDate('');
        setFormLocation('');
        setFormDescription('');
        setFormErrors({});
        setIsSubmitting(false);
    };

    const handleCreate = () => {
        setIsSubmitting(true);
        setFormErrors({});
        router.post(
            eventsStore(teamSlug).url,
            {
                title: formTitle,
                type: formType,
                client_id: null,
                start_date: formStartDate || null,
                end_date: formEndDate || null,
                location: formLocation || null,
                description: formDescription || null,
            },
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

    const handleDelete = (eventId: number) => {
        router.delete(
            eventsDestroy({ current_team: teamSlug, event: eventId }).url,
            {
                onSuccess: () => setDeleteConfirmId(null),
            },
        );
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString(undefined, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const columns = useMemo<ColumnDef<Event, unknown>[]>(
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
                            aria-label={t('ai.events.select_all')}
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
                            aria-label={t('ai.events.select_row')}
                        />
                    </div>
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: 'title',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === 'asc')
                        }
                    >
                        {t('ai.events.title')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <a
                        href={eventsShow({ current_team: teamSlug, event: row.original.id }).url}
                        className="font-medium hover:underline"
                    >
                        {row.original.title}
                    </a>
                ),
                enableHiding: false,
            },
            {
                accessorKey: 'type',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === 'asc')
                        }
                    >
                        {t('ai.events.type')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => {
                    const cfg = typeConfig[row.original.type];
                    return cfg ? (
                        <Badge className={cfg.className}>{t(cfg.label)}</Badge>
                    ) : (
                        <Badge variant="outline">{row.original.type}</Badge>
                    );
                },
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
                        {t('ai.events.client')}
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
                        {t('ai.events.status')}
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
                accessorKey: 'start_date',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === 'asc')
                        }
                    >
                        {t('ai.events.start_date')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <span className="text-sm text-muted-foreground">
                        {formatDate(row.original.start_date)}
                    </span>
                ),
            },
            {
                accessorKey: 'location',
                header: t('ai.events.location'),
                cell: ({ row }) => (
                    <span className="text-sm text-muted-foreground">
                        {row.original.location ?? '-'}
                    </span>
                ),
            },
            {
                id: 'actions',
                cell: ({ row }) => {
                    const event = row.original;

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
                                                    eventsShow({ current_team: teamSlug, event: event.id }).url,
                                                )
                                            }
                                        >
                                            <Eye className="h-4 w-4" />
                                            <span className="sr-only">{t('ai.events.view')}</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t('ai.events.view_event')}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <Guard permission="ai.event.delete">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => setDeleteConfirmId(event.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">{t('ai.events.delete')}</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{t('ai.events.delete')}</TooltipContent>
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
        <AppLayout breadcrumbs={[{ title: t('ai.events.breadcrumb') }]}>
            <Head title={t('ai.events.breadcrumb')} />

            <div className="space-y-6">

                {(events ?? []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Calendar className="mb-4 h-12 w-12 opacity-20" />
                        <p className="text-sm">{t('ai.events.no_events')}</p>
                    </div>
                ) : (
                    <DataTable<Event>
                        columns={columns}
                        data={events}
                        getRowId={(row) => row.id.toString()}
                        enableRowSelection={true}
                        searchPlaceholder={t('ai.events.search')}
                        emptyMessage={t('ai.events.no_results')}
                        columnLabels={{
                            client_name: t('ai.events.client'),
                            start_date: t('ai.events.start_date'),
                            location: t('ai.events.location'),
                            status: t('ai.events.status'),
                            type: t('ai.events.type'),
                        }}
                        toolbarSlot={
                            <div className="flex items-center gap-2">
                                <Guard permission="ai.event.create">
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            resetForm();
                                            setCreateDialogOpen(true);
                                        }}
                                    >
                                        <Plus className="h-4 w-4" />
                                        {t('ai.events.new')}
                                    </Button>
                                </Guard>
                                <Guard permission="ai.event.create">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setStepperOpen(true)}
                                    >
                                        <Play className="h-4 w-4" />
                                        {t('ai.events.mode')}
                                    </Button>
                                </Guard>
                            </div>
                        }
                    />
                )}
            </div>

            {/* Create Event Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('ai.events.new')}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="event-title">{t('ai.events.form.title')}</Label>
                            <Input
                                id="event-title"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                placeholder={t('ai.events.form.title_placeholder')}
                                autoFocus
                            />
                            {formErrors.title && (
                                <p className="text-sm text-destructive">{formErrors.title}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label>{t('ai.events.form.type')}</Label>
                            <Select value={formType} onValueChange={setFormType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="service">{t('ai.events.type_service')}</SelectItem>
                                    <SelectItem value="event">{t('ai.events.type_event')}</SelectItem>
                                    <SelectItem value="consultation">{t('ai.events.type_consultation')}</SelectItem>
                                    <SelectItem value="formation">{t('ai.events.type_formation')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="event-start-date">{t('ai.events.form.start_date')}</Label>
                                <Input
                                    id="event-start-date"
                                    type="datetime-local"
                                    value={formStartDate}
                                    onChange={(e) => setFormStartDate(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="event-end-date">{t('ai.events.form.end_date')}</Label>
                                <Input
                                    id="event-end-date"
                                    type="datetime-local"
                                    value={formEndDate}
                                    onChange={(e) => setFormEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="event-location">{t('ai.events.form.location')}</Label>
                            <Input
                                id="event-location"
                                value={formLocation}
                                onChange={(e) => setFormLocation(e.target.value)}
                                placeholder={t('ai.events.form.location_placeholder')}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="event-description">{t('ai.events.form.description')}</Label>
                            <Textarea
                                id="event-description"
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                placeholder={t('ai.events.form.description_placeholder')}
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setCreateDialogOpen(false)}
                        >
                            {t('ai.events.cancel')}
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={!formTitle.trim() || isSubmitting}
                        >
                            {isSubmitting ? t('ai.events.creating') : t('ai.events.create')}
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
                        <DialogTitle>{t('ai.events.delete_title')}</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        {t('ai.events.delete_confirm')}
                    </p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteConfirmId(null)}
                        >
                            {t('ai.events.cancel')}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (deleteConfirmId) {
                                    handleDelete(deleteConfirmId);
                                }
                            }}
                        >
                            {t('ai.events.delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <EventStepper open={stepperOpen} onClose={() => setStepperOpen(false)} clients={clients ?? []} />
        </AppLayout>
    );
}
