import { Head, router, useForm, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Archive, ArchiveRestore, ArrowUpDown, Eye, MessageSquare, PlusCircle, X } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { store as conversationsStore, show as conversationsShow, index as conversationsIndex } from '@/routes/ai/conversations';
import type { Conversation } from '@/types/ailes-invisibles';
import { conversationTypeConfig as typeConfig } from '@/types/ailes-invisibles';
import DataTable from '../../../../components/data-table';

type ClientOption = {
    id: number;
    name: string;
    company_name: string | null;
    portal_user: { id: number; email: string } | null;
};

type Props = { conversations: Conversation[]; clients: ClientOption[]; isArchived?: boolean };

export default function Index({ conversations, clients, isArchived = false }: Props) {
    const { t } = useTranslation();
    const teamSlug = (usePage().props.currentTeam as { slug: string } | undefined)?.slug ?? '';
    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState<'active' | 'archived'>(isArchived ? 'archived' : 'active');

    const form = useForm({
        title: '',
        type: 'direct' as string,
        message: '',
        participants: [] as { participant_type: string; participant_id: number }[],
    });

    const [selectedClientIds, setSelectedClientIds] = useState<number[]>([]);

    const toggleClient = (clientId: number) => {
        setSelectedClientIds((prev) => {
            const next = prev.includes(clientId)
                ? prev.filter((id) => id !== clientId)
                : [...prev, clientId];
            const participants = next
                .map((id) => {
                    const client = clients.find((c) => c.id === id);
                    if (!client?.portal_user) return null;
                    return {
                        participant_type: 'Modules\\AilesInvisibles\\Models\\ClientUser',
                        participant_id: client.portal_user.id,
                    };
                })
                .filter(Boolean) as { participant_type: string; participant_id: number }[];
            form.setData('participants', participants);
            return next;
        });
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(conversationsStore({ current_team: teamSlug }).url, {
            onSuccess: () => {
                setOpen(false);
                form.reset();
                setSelectedClientIds([]);
            },
        });
    };

    const handleFilterChange = (value: 'active' | 'archived') => {
        setFilter(value);
        router.visit(
            conversationsIndex({ current_team: teamSlug }).url + (value === 'archived' ? '?archived=1' : ''),
        );
    };

    const columns = useMemo<ColumnDef<Conversation, unknown>[]>(
        () => [
            {
                accessorKey: 'title',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        {t('ai.conversations.title')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <span className="font-medium">
                        {row.original.title ?? t('ai.conversations.untitled')}
                    </span>
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
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        {t('ai.conversations.type')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
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
                id: 'participants',
                header: t('ai.conversations.participants'),
                cell: ({ row }) => (
                    <span className="text-sm text-muted-foreground">
                        {(row.original.participants ?? []).map((p) => p.name).join(', ') || '-'}
                    </span>
                ),
            },
            {
                accessorKey: 'last_message_at',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        {t('ai.conversations.last_message')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <span className="text-sm text-muted-foreground">
                        {row.original.last_message_at
                            ? new Date(row.original.last_message_at).toLocaleDateString(undefined, {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                              })
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
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        {t('ai.conversations.creation_date')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) =>
                    new Date(row.original.created_at).toLocaleDateString(undefined, {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                    }),
            },
            {
                id: 'actions',
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-1">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8"
                                        onClick={() => {
                                            router.visit(conversationsShow({ current_team: teamSlug, conversation: row.original.id }).url);
                                        }}
                                    >
                                        <Eye className="h-4 w-4" />
                                        <span className="sr-only">{t('ai.conversations.view')}</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>{t('ai.conversations.view')}</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8"
                                        onClick={() => {
                                            const url = row.original.archived_at
                                                ? `/${teamSlug}/ai/conversations/${row.original.id}/unarchive`
                                                : `/${teamSlug}/ai/conversations/${row.original.id}/archive`;
                                            router.post(url, {}, {
                                                preserveScroll: true,
                                                onSuccess: () => router.reload(),
                                            });
                                        }}
                                    >
                                        {row.original.archived_at ? (
                                            <ArchiveRestore className="h-4 w-4" />
                                        ) : (
                                            <Archive className="h-4 w-4" />
                                        )}
                                        <span className="sr-only">
                                            {row.original.archived_at ? t('ai.conversations.unarchive') : t('ai.conversations.archive')}
                                        </span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {row.original.archived_at ? t('ai.conversations.unarchive') : t('ai.conversations.archive')}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                ),
                enableHiding: false,
            },
        ],
        [t, teamSlug],
    );

    const toolbarSlot = (
        <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border bg-muted p-0.5">
                <Button
                    variant={filter === 'active' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 px-3 text-xs"
                    onClick={() => handleFilterChange('active')}
                >
                    {t('ai.conversations.active')}
                </Button>
                <Button
                    variant={filter === 'archived' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 px-3 text-xs"
                    onClick={() => handleFilterChange('archived')}
                >
                    {t('ai.conversations.archived')}
                </Button>
            </div>
            <Guard permission="ai.conversation.create">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {t('ai.conversations.new')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{t('ai.conversations.new')}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <Label htmlFor="title">{t('ai.conversations.title')}</Label>
                                <Input
                                    id="title"
                                    value={form.data.title}
                                    onChange={(e) => form.setData('title', e.target.value)}
                                    placeholder={t('ai.conversations.title_placeholder')}
                                />
                            </div>
                            <div>
                                <Label>{t('ai.conversations.type')}</Label>
                                <Select
                                    value={form.data.type}
                                    onValueChange={(v) => form.setData('type', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="direct">{t('ai.conversations.type_direct')}</SelectItem>
                                        <SelectItem value="group">{t('ai.conversations.type_group')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>{t('ai.conversations.select_clients')}</Label>
                                {clients.length > 0 ? (
                                    <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">
                                        {clients.map((client) => (
                                            <label
                                                key={client.id}
                                                className="flex cursor-pointer items-center gap-3 rounded-md p-2 text-sm transition-colors hover:bg-accent"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedClientIds.includes(client.id)}
                                                    onChange={() => toggleClient(client.id)}
                                                    className="rounded border-muted-foreground"
                                                    disabled={!client.portal_user}
                                                />
                                                <div className="flex-1">
                                                    <span className="font-medium">{client.name}</span>
                                                    {client.company_name && (
                                                        <span className="ml-2 text-muted-foreground">({client.company_name})</span>
                                                    )}
                                                </div>
                                                {!client.portal_user && (
                                                    <span className="text-xs text-muted-foreground">{t('ai.conversations.no_portal_user')}</span>
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-2 text-sm text-muted-foreground">{t('ai.conversations.no_clients')}</p>
                                )}
                            </div>
                            {selectedClientIds.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedClientIds.map((id) => {
                                        const client = clients.find((c) => c.id === id);
                                        if (!client) return null;
                                        return (
                                            <Badge key={id} variant="secondary" className="gap-1">
                                                {client.name}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleClient(id)}
                                                    className="ml-1 rounded-full p-0.5 hover:bg-muted"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        );
                                    })}
                                </div>
                            )}
                            <div>
                                <Label htmlFor="message">{t('ai.conversations.initial_message')}</Label>
                                <Textarea
                                    id="message"
                                    value={form.data.message}
                                    onChange={(e) => form.setData('message', e.target.value)}
                                    placeholder={t('ai.conversations.e2e_placeholder')}
                                    rows={4}
                                    required
                                />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {t('ai.conversations.e2e_notice')}
                                </p>
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={form.processing || form.data.participants.length === 0}
                            >
                                {t('ai.conversations.create')}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </Guard>
        </div>
    );

    return (
        <AppLayout breadcrumbs={[{ title: t('ai.conversations.breadcrumb') }]}>
            <Head title={t('ai.conversations.breadcrumb')} />

            <div className="space-y-6">
                {(conversations ?? []).length === 0 && !open ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <MessageSquare className="mb-4 h-12 w-12 opacity-20" />
                        <p className="text-sm">{t('ai.conversations.no_conversations')}</p>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={conversations}
                        getRowId={(row) => row.id.toString()}
                        searchPlaceholder={t('ai.conversations.search')}
                        emptyMessage={t('ai.conversations.no_conversations_table')}
                        emptyIcon={MessageSquare}
                        toolbarSlot={toolbarSlot}
                        columnLabels={{
                            last_message_at: t('ai.conversations.last_message'),
                            created_at: t('ai.conversations.creation_date'),
                            type: t('ai.conversations.type'),
                            participants: t('ai.conversations.participants'),
                        }}
                    />
                )}
            </div>
        </AppLayout>
    );
}
