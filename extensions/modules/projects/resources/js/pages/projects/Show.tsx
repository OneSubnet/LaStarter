import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    updated_at: string;
}

interface Props {
    project: Project;
}

const statusVariantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    completed: 'secondary',
    on_hold: 'outline',
    cancelled: 'destructive',
};

export default function ProjectShow({ project }: Props) {
    const { t } = useTranslation();
    const { auth } = usePage().props as { auth: { permissions: string[] } };
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        name: project.name,
        description: project.description || '',
        status: project.status,
        visibility: project.visibility,
        deadline: project.deadline || '',
    });

    const canEdit = auth.permissions?.includes('project.update');
    const canDelete = auth.permissions?.includes('project.delete');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('extensions.projects.nav_title', 'Projects'), href: '/projects' },
        { title: project.name, href: `/projects/${project.id}` },
    ];

    const statusConfig: Record<string, string> = {
        active: t('extensions.projects.status_active', 'Active'),
        completed: t('extensions.projects.status_completed', 'Completed'),
        on_hold: t('extensions.projects.status_on_hold', 'On Hold'),
        cancelled: t('extensions.projects.status_cancelled', 'Cancelled'),
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        router.put(`/projects/${project.id}`, form, {
            onSuccess: () => setEditing(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={project.name} />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.get('/projects')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">{project.name}</h2>
                            <div className="mt-1 flex items-center gap-2">
                                <Badge variant={statusVariantMap[project.status] || 'outline'}>
                                    {statusConfig[project.status] || project.status}
                                </Badge>
                                <span className="text-sm text-muted-foreground capitalize">{project.visibility}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {canEdit && (
                            <Button variant="outline" onClick={() => setEditing(!editing)}>
                                <Pencil className="h-4 w-4" />
                                {t('common.edit', 'Edit')}
                            </Button>
                        )}
                        {canDelete && (
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    if (confirm(t('common.confirm_delete', 'Are you sure?'))) {
                                        router.delete(`/projects/${project.id}`);
                                    }
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                                {t('common.delete', 'Delete')}
                            </Button>
                        )}
                    </div>
                </div>

                {editing ? (
                    <form onSubmit={handleUpdate} className="space-y-4 rounded-lg border p-6">
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
                                rows={4}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
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
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
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
                            <div className="space-y-2">
                                <Label htmlFor="project-deadline">{t('extensions.projects.col_deadline', 'Deadline')}</Label>
                                <Input
                                    id="project-deadline"
                                    type="date"
                                    value={form.deadline}
                                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                                {t('common.cancel', 'Cancel')}
                            </Button>
                            <Button type="submit">
                                {t('common.save', 'Save')}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="rounded-lg border p-6">
                        <h3 className="font-semibold">{t('extensions.projects.col_description', 'Description')}</h3>
                        <p className="mt-2 text-muted-foreground whitespace-pre-wrap">{project.description || t('extensions.projects.no_description', 'No description provided.')}</p>

                        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">{t('extensions.projects.col_deadline', 'Deadline')}:</span>
                                <span className="ml-2 font-medium">{project.deadline || '—'}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">{t('extensions.projects.created', 'Created')}:</span>
                                <span className="ml-2 font-medium">{project.created_at}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
