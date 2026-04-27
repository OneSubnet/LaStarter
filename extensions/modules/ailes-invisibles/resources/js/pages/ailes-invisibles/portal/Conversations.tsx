import { Head, Link, useForm } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MessageSquare, PlusCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import DataTable from '../../../components/data-table';
import PortalLayout from '../../../layouts/portal/portal-layout';
import { usePortalUrl } from '../../../hooks/use-portal-url';
import { conversationTypeConfig } from '@/types/ailes-invisibles';
import type { PortalConversation } from '@/types/ailes-invisibles';

type Props = { conversations: PortalConversation[] };

export default function Conversations({ conversations }: Props) {
    const { t } = useTranslation();
    const p = usePortalUrl();
    const [open, setOpen] = useState(false);

    const form = useForm({
        title: '',
        type: 'direct' as string,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(p('/chat'), {
            onSuccess: () => {
                setOpen(false);
                form.reset();
            },
        });
    };

    const columns = useMemo<ColumnDef<PortalConversation, unknown>[]>(
        () => [
            {
                accessorKey: 'title',
                header: ({ column }) => (
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                        {t('ai.conversations.conversation')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <Link href={p(`/chat/${row.original.id}`)} className="font-medium hover:underline">
                        {row.original.title ?? t('ai.conversations.conversation')}
                    </Link>
                ),
            },
            {
                accessorKey: 'type',
                header: t('ai.conversations.type'),
                cell: ({ row }) => {
                    const typeConfig = conversationTypeConfig[row.original.type];
                    return typeConfig ? (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeConfig.className}`}>
                            {t(typeConfig.label)}
                        </span>
                    ) : (
                        <span className="text-sm text-muted-foreground">{row.original.type}</span>
                    );
                },
            },
            {
                accessorKey: 'last_message_at',
                header: ({ column }) => (
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                        {t('ai.conversations.last_message')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <span className="text-sm text-muted-foreground">
                        {row.original.last_message_at
                            ? new Date(row.original.last_message_at).toLocaleDateString(undefined, {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                              })
                            : '—'}
                    </span>
                ),
            },
        ],
        [t, p],
    );

    const toolbarSlot = (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t('ai.conversations.new_conversation')}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('ai.conversations.new_conversation')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <Label htmlFor="title">{t('ai.conversations.title')}</Label>
                        <Input
                            id="title"
                            value={form.data.title}
                            onChange={(e) => form.setData('title', e.target.value)}
                            placeholder={t('ai.conversations.title_placeholder')}
                            required
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
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={form.processing}
                    >
                        {t('ai.conversations.create')}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );

    return (
        <PortalLayout breadcrumbs={[{ title: t('ai.portal.messages') }]}>
            <Head title={t('ai.portal.chat_title')} />

            <DataTable
                columns={columns}
                data={conversations ?? []}
                getRowId={(row) => row.id.toString()}
                searchPlaceholder={t('ai.conversations.search')}
                emptyMessage={t('ai.conversations.no_conversations')}
                emptyIcon={MessageSquare}
                toolbarSlot={toolbarSlot}
                columnLabels={{
                    title: t('ai.conversations.conversation'),
                    type: t('ai.conversations.type'),
                    last_message_at: t('ai.conversations.last_message'),
                }}
            />
        </PortalLayout>
    );
}
