import { Head, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Download, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { store as documentsStore, destroy as documentsDestroy, download as documentsDownload } from '@/routes/ai/documents';
import type { Document, ClientSummary } from '@/types/ailes-invisibles';
import { documentStatusConfig as statusConfig } from '@/types/ailes-invisibles';

type ClientPick = Pick<ClientSummary, 'id' | 'first_name' | 'last_name'>;

type Props = {
    documents: Document[];
    clients: ClientPick[];
};

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const mb = bytes / 1024 / 1024;
    if (mb >= 1) {
        return `${mb.toFixed(1)} MB`;
    }
    const kb = bytes / 1024;
    return `${kb.toFixed(1)} KB`;
}

export default function Index({ documents, clients }: Props) {
    const { t } = useTranslation();
    const teamSlug = (usePage().props.currentTeam as { slug: string } | undefined)?.slug ?? '';

    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadClientId, setUploadClientId] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadCategory, setUploadCategory] = useState('');
    const [uploadRequiresSignature, setUploadRequiresSignature] = useState(false);
    const [uploadInstructions, setUploadInstructions] = useState('');
    const [uploading, setUploading] = useState(false);

    const handleUpload = () => {
        if (!uploadFile) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('title', uploadTitle);
        formData.append('client_id', uploadClientId);
        formData.append('file', uploadFile);
        formData.append('category', uploadCategory);
        formData.append('requires_signature', uploadRequiresSignature ? '1' : '0');
        formData.append('instructions', uploadInstructions);

        router.post(
            documentsStore({ current_team: teamSlug }).url,
            formData,
            {
                onSuccess: () => {
                    setUploadDialogOpen(false);
                    setUploadTitle('');
                    setUploadClientId('');
                    setUploadFile(null);
                    setUploadCategory('');
                    setUploadRequiresSignature(false);
                    setUploadInstructions('');
                },
                onFinish: () => setUploading(false),
            },
        );
    };

    const handleDownload = (documentId: number) => {
        window.open(
            documentsDownload({ current_team: teamSlug, document: documentId }).url,
        );
    };

    const handleDelete = (documentId: number) => {
        router.delete(
            documentsDestroy({ current_team: teamSlug, document: documentId }).url,
        );
    };

    const columns = useMemo<ColumnDef<Document, unknown>[]>(
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
                        {t('ai.documents.title')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
                cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
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
                        {t('ai.documents.client')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                ),
            },
            {
                accessorKey: 'category',
                header: t('ai.documents.category'),
                cell: ({ row }) => (
                    <span className="text-sm text-muted-foreground">
                        {row.original.category ?? '-'}
                    </span>
                ),
            },
            {
                accessorKey: 'status',
                header: t('ai.documents.status'),
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
                accessorKey: 'requires_signature',
                header: t('ai.documents.requires_signature'),
                cell: ({ row }) => (
                    <span className="text-sm">
                        {row.original.requires_signature ? (
                            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{t('ai.status.yes')}</Badge>
                        ) : (
                            <span className="text-muted-foreground">{t('ai.status.no')}</span>
                        )}
                    </span>
                ),
            },
            {
                accessorKey: 'file_size',
                header: t('ai.documents.size'),
                cell: ({ row }) => (
                    <span className="text-sm text-muted-foreground">
                        {formatFileSize(row.original.file_size)}
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
                cell: ({ row }) => {
                    const doc = row.original;
                    return (
                        <div className="flex items-center justify-end gap-1">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8"
                                            onClick={() => handleDownload(doc.id)}
                                        >
                                            <Download className="h-4 w-4" />
                                            <span className="sr-only">{t('ai.documents.download')}</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t('ai.documents.download')}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <Guard permission="ai.document.delete">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleDelete(doc.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">{t('ai.documents.delete')}</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{t('ai.documents.delete')}</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </Guard>
                        </div>
                    );
                },
                enableHiding: false,
            },
        ],
        [t, teamSlug],
    );

    return (
        <AppLayout breadcrumbs={[{ title: t('ai.documents.breadcrumb') }]}>
            <Head title={t('ai.documents.breadcrumb')} />

            <div className="space-y-6">
                <DataTable
                    columns={columns}
                    data={documents}
                    getRowId={(row) => row.id.toString()}
                    searchPlaceholder={t('ai.documents.search')}
                    emptyMessage={t('ai.documents.no_documents')}
                    enableRowSelection
                    toolbarSlot={
                        <Guard permission="ai.document.upload">
                            <Button size="sm" onClick={() => setUploadDialogOpen(true)}>
                                <Plus className="h-4 w-4" />
                                {t('ai.documents.upload')}
                            </Button>
                        </Guard>
                    }
                    columnLabels={{
                        client_name: t('ai.documents.client'),
                        category: t('ai.documents.category'),
                        status: t('ai.documents.status'),
                        requires_signature: t('ai.documents.requires_signature'),
                        file_size: t('ai.documents.size'),
                        created_at: t('ai.documents.date'),
                    }}
                />
            </div>

            {/* Upload Document Dialog */}
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('ai.documents.upload')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="doc-title">{t('ai.documents.title')}</Label>
                            <Input
                                id="doc-title"
                                value={uploadTitle}
                                onChange={(e) => setUploadTitle(e.target.value)}
                                placeholder={t('ai.documents.title_placeholder')}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>{t('ai.documents.client')}</Label>
                            <Select value={uploadClientId} onValueChange={setUploadClientId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('ai.documents.select_client')} />
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
                            <Label htmlFor="doc-file">{t('ai.documents.file')}</Label>
                            <Input
                                id="doc-file"
                                type="file"
                                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="doc-category">{t('ai.documents.category')}</Label>
                            <Input
                                id="doc-category"
                                value={uploadCategory}
                                onChange={(e) => setUploadCategory(e.target.value)}
                                placeholder={t('ai.documents.category_placeholder')}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="doc-signature"
                                checked={uploadRequiresSignature}
                                onCheckedChange={(checked) => setUploadRequiresSignature(checked === true)}
                            />
                            <Label htmlFor="doc-signature" className="text-sm font-normal">
                                {t('ai.documents.requires_signature')}
                            </Label>
                        </div>
                        {uploadRequiresSignature && (
                            <div className="grid gap-2">
                                <Label htmlFor="doc-instructions">{t('ai.documents.instructions')}</Label>
                                <textarea
                                    id="doc-instructions"
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={uploadInstructions}
                                    onChange={(e) => setUploadInstructions(e.target.value)}
                                    placeholder={t('ai.documents.instructions_placeholder')}
                                />
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                                {t('ai.documents.cancel')}
                            </Button>
                            <Button onClick={handleUpload} disabled={uploading || !uploadFile || !uploadTitle}>
                                {uploading ? t('ai.documents.uploading') : t('ai.documents.upload_btn')}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
