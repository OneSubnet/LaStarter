import { Head, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Download, FileText } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DataTable from '../../../components/data-table';
import PortalLayout from '../../../layouts/portal/portal-layout';
import type { PortalDocument as Document } from '@/types/ailes-invisibles';
import { portalDocumentStatusConfig as statusConfig } from '@/types/ailes-invisibles';
import { usePortalUrl } from '../../../hooks/use-portal-url';

type Props = { documents: Document[] };

export default function Documents({ documents }: Props) {
    const { t } = useTranslation();
    const p = usePortalUrl();

    const columns = useMemo<ColumnDef<Document, unknown>[]>(
        () => [
            {
                accessorKey: 'title',
                header: ({ column }) => (
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                        {t('ai.documents.document')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium">{row.original.title}</span>
                    </div>
                ),
            },
            {
                accessorKey: 'category',
                header: t('ai.documents.category'),
                cell: ({ row }) => row.original.category ?? '—',
            },
            {
                accessorKey: 'status',
                header: t('ai.documents.status'),
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
                accessorKey: 'created_at',
                header: ({ column }) => (
                    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                        {t('ai.documents.date')}
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
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-1">
                        {row.original.requires_signature && row.original.status !== 'signed' && (
                            <Button size="sm" variant="outline" onClick={() => {
                                if (confirm(t('ai.documents.sign_confirm'))) {
                                    router.post(p('/documents/' + row.original.id + '/sign'), {
                                        signature_data: 'confirmed',
                                    }, { preserveScroll: true });
                                }
                            }}>
                                {t('ai.documents.sign')}
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" className="size-8" asChild>
                            <a href={p('/documents/' + row.original.id + '/download')}>
                                <Download className="h-4 w-4" />
                            </a>
                        </Button>
                    </div>
                ),
            },
        ],
        [t, p],
    );

    return (
        <PortalLayout breadcrumbs={[{ title: t('ai.portal.documents') }]}>
            <Head title={t('ai.portal.documents_title')} />

            <DataTable
                columns={columns}
                data={documents ?? []}
                getRowId={(row) => row.id.toString()}
                searchPlaceholder={t('ai.documents.search')}
                emptyMessage={t('ai.documents.no_documents')}
                emptyIcon={FileText}
                columnLabels={{
                    title: t('ai.documents.document'),
                    category: t('ai.documents.category'),
                    status: t('ai.documents.status'),
                    created_at: t('ai.documents.date'),
                }}
            />
        </PortalLayout>
    );
}
