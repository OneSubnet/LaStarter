import { Head, router, usePage } from '@inertiajs/react';
import { FolderKanban, Plus, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Project {
    id: number;
    name: string;
    description: string | null;
    status: string;
    visibility: string;
    deadline: string | null;
    created_at: string;
}

interface Props {
    projects: {
        data: Project[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: { search?: string; status?: string };
}

const statusVariantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    completed: 'secondary',
    on_hold: 'outline',
    cancelled: 'destructive',
};

export default function ProjectsIndex({ projects, filters }: Props) {
    const { t } = useTranslation();
    const [showCreate, setShowCreate] = useState(false);
    const [search, setSearch] = useState(filters.search || '');
    const { auth } = usePage().props as { auth: { permissions: string[] } };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('extensions.projects.nav_title', 'Projects'), href: '/projects' },
    ];

    const statusConfig: Record<string, string> = {
        active: t('extensions.projects.status_active', 'Active'),
        completed: t('extensions.projects.status_completed', 'Completed'),
        on_hold: t('extensions.projects.status_on_hold', 'On Hold'),
        cancelled: t('extensions.projects.status_cancelled', 'Cancelled'),
    };

    const canCreate = auth.permissions?.includes('project.create');
    const canEdit = auth.permissions?.includes('project.update');
    const canDelete = auth.permissions?.includes('project.delete');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('extensions.projects.page_title', 'Projects')} />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">
                        {t('extensions.projects.page_title', 'Projects')}
                    </h2>
                    {canCreate && (
                        <Button onClick={() => setShowCreate(true)}>
                            <Plus className="h-4 w-4" />
                            {t('extensions.projects.create', 'New Project')}
                        </Button>
                    )}
                </div>

                {/* Search */}
                <div className="flex gap-4">
                    <Input
                        type="text"
                        placeholder={t('extensions.projects.search', 'Search projects...')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && router.get('/projects', { search }, { preserveState: true })}
                        className="max-w-sm"
                    />
                </div>

                {/* Projects Table */}
                {projects.data.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center">
                        <FolderKanban className="mx-auto h-10 w-10 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">
                            {t('extensions.projects.empty', 'No projects yet. Create your first project!')}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('extensions.projects.col_name', 'Name')}</TableHead>
                                    <TableHead>{t('extensions.projects.col_status', 'Status')}</TableHead>
                                    <TableHead>{t('extensions.projects.col_visibility', 'Visibility')}</TableHead>
                                    <TableHead>{t('extensions.projects.col_deadline', 'Deadline')}</TableHead>
                                    <TableHead className="text-right">{t('common.actions', 'Actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projects.data.map((project) => (
                                    <TableRow key={project.id}>
                                        <TableCell>
                                            <button
                                                onClick={() => router.get(`/projects/${project.id}`)}
                                                className="font-medium text-primary hover:underline"
                                            >
                                                {project.name}
                                            </button>
                                            {project.description && (
                                                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{project.description}</p>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={statusVariantMap[project.status] || 'outline'}>
                                                {statusConfig[project.status] || project.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="capitalize">{project.visibility}</TableCell>
                                        <TableCell className="text-muted-foreground">{project.deadline || '—'}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {canEdit && (
                                                    <Button variant="ghost" size="icon-xs" onClick={() => router.get(`/projects/${project.id}`)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {canDelete && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-xs"
                                                        className="text-destructive hover:bg-destructive/10"
                                                        onClick={() => {
                                                            if (confirm(t('common.confirm_delete', 'Are you sure?'))) {
                                                                router.delete(`/projects/${project.id}`);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* Pagination */}
                {projects.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2 text-sm">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={projects.current_page === 1}
                            onClick={() => router.get('/projects', { page: projects.current_page - 1, search })}
                        >
                            {t('common.previous', 'Previous')}
                        </Button>
                        <span>{projects.current_page} / {projects.last_page}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={projects.current_page === projects.last_page}
                            onClick={() => router.get('/projects', { page: projects.current_page + 1, search })}
                        >
                            {t('common.next', 'Next')}
                        </Button>
                    </div>
                )}
            </div>

            {/* Create Dialog */}
            <CreateProjectDialog open={showCreate} onOpenChange={setShowCreate} />
        </AppLayout>
    );
}

function CreateProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        name: '',
        description: '',
        status: 'active',
        visibility: 'private',
        deadline: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/projects', form, {
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('extensions.projects.create', 'New Project')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="project-name">{t('extensions.projects.col_name', 'Name')}</Label>
                        <Input
                            id="project-name"
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="project-description">{t('extensions.projects.col_description', 'Description')}</Label>
                        <Textarea
                            id="project-description"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={3}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{t('extensions.projects.col_status', 'Status')}</Label>
                            <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="on_hold">On Hold</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('extensions.projects.col_visibility', 'Visibility')}</Label>
                            <Select value={form.visibility} onValueChange={(value) => setForm({ ...form, visibility: value })}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="private">Private</SelectItem>
                                    <SelectItem value="public">Public</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="project-deadline">{t('extensions.projects.col_deadline', 'Deadline')}</Label>
                        <Input
                            id="project-deadline"
                            type="date"
                            value={form.deadline}
                            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button type="submit">
                            {t('common.create', 'Create')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
