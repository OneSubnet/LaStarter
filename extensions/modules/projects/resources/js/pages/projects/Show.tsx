import { useTranslation } from 'react-i18next';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
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

    const statusConfig: Record<string, { label: string; className: string }> = {
        active: { label: t('extensions.projects.status_active', 'Active'), className: 'bg-green-100 text-green-700' },
        completed: { label: t('extensions.projects.status_completed', 'Completed'), className: 'bg-blue-100 text-blue-700' },
        on_hold: { label: t('extensions.projects.status_on_hold', 'On Hold'), className: 'bg-yellow-100 text-yellow-700' },
        cancelled: { label: t('extensions.projects.status_cancelled', 'Cancelled'), className: 'bg-gray-100 text-gray-700' },
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
                        <button onClick={() => router.get('/projects')} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">{project.name}</h2>
                            <div className="mt-1 flex items-center gap-2">
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig[project.status]?.className || ''}`}>
                                    {statusConfig[project.status]?.label || project.status}
                                </span>
                                <span className="text-sm text-muted-foreground capitalize">{project.visibility}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {canEdit && (
                            <button
                                onClick={() => setEditing(!editing)}
                                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                <Pencil className="h-4 w-4" />
                                {t('common.edit', 'Edit')}
                            </button>
                        )}
                        {canDelete && (
                            <button
                                onClick={() => {
                                    if (confirm(t('common.confirm_delete', 'Are you sure?'))) {
                                        router.delete(`/projects/${project.id}`);
                                    }
                                }}
                                className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                <Trash2 className="h-4 w-4" />
                                {t('common.delete', 'Delete')}
                            </button>
                        )}
                    </div>
                </div>

                {editing ? (
                    <form onSubmit={handleUpdate} className="space-y-4 rounded-lg border p-6">
                        <div>
                            <label className="text-sm font-medium">{t('extensions.projects.col_name', 'Name')}</label>
                            <input
                                type="text"
                                required
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">{t('extensions.projects.col_description', 'Description')}</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                rows={4}
                                className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-medium">{t('extensions.projects.col_status', 'Status')}</label>
                                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800">
                                    <option value="active">Active</option>
                                    <option value="on_hold">On Hold</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">{t('extensions.projects.col_visibility', 'Visibility')}</label>
                                <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800">
                                    <option value="private">Private</option>
                                    <option value="public">Public</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">{t('extensions.projects.col_deadline', 'Deadline')}</label>
                                <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setEditing(false)} className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                                {t('common.cancel', 'Cancel')}
                            </button>
                            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                                {t('common.save', 'Save')}
                            </button>
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
