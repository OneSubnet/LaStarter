import { useTranslation } from 'react-i18next';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { FolderKanban, Plus, Pencil, Trash2 } from 'lucide-react';
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

export default function ProjectsIndex({ projects, filters }: Props) {
    const { t } = useTranslation();
    const [showCreate, setShowCreate] = useState(false);
    const [search, setSearch] = useState(filters.search || '');
    const { auth } = usePage().props as { auth: { permissions: string[] } };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('extensions.projects.nav_title', 'Projects'), href: '/projects' },
    ];

    const statusConfig: Record<string, { label: string; className: string }> = {
        active: { label: t('extensions.projects.status_active', 'Active'), className: 'bg-green-100 text-green-700' },
        completed: { label: t('extensions.projects.status_completed', 'Completed'), className: 'bg-blue-100 text-blue-700' },
        on_hold: { label: t('extensions.projects.status_on_hold', 'On Hold'), className: 'bg-yellow-100 text-yellow-700' },
        cancelled: { label: t('extensions.projects.status_cancelled', 'Cancelled'), className: 'bg-gray-100 text-gray-700' },
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
                        <button
                            onClick={() => setShowCreate(true)}
                            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4" />
                            {t('extensions.projects.create', 'New Project')}
                        </button>
                    )}
                </div>

                {/* Search */}
                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder={t('extensions.projects.search', 'Search projects...')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && router.get('/projects', { search }, { preserveState: true })}
                        className="rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
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
                        <table className="w-full text-sm">
                            <thead className="border-b bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">{t('extensions.projects.col_name', 'Name')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('extensions.projects.col_status', 'Status')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('extensions.projects.col_visibility', 'Visibility')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('extensions.projects.col_deadline', 'Deadline')}</th>
                                    <th className="px-4 py-3 text-right font-medium">{t('common.actions', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.data.map((project) => (
                                    <tr key={project.id} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => router.get(`/projects/${project.id}`)}
                                                className="font-medium text-blue-600 hover:underline"
                                            >
                                                {project.name}
                                            </button>
                                            {project.description && (
                                                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{project.description}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig[project.status]?.className || 'bg-gray-100 text-gray-700'}`}>
                                                {statusConfig[project.status]?.label || project.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 capitalize">{project.visibility}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{project.deadline || '—'}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {canEdit && (
                                                    <button className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm(t('common.confirm_delete', 'Are you sure?'))) {
                                                                router.delete(`/projects/${project.id}`);
                                                            }
                                                        }}
                                                        className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {projects.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2 text-sm">
                        <button
                            disabled={projects.current_page === 1}
                            onClick={() => router.get('/projects', { page: projects.current_page - 1, search })}
                            className="rounded border px-3 py-1 disabled:opacity-50"
                        >
                            {t('common.previous', 'Previous')}
                        </button>
                        <span>{projects.current_page} / {projects.last_page}</span>
                        <button
                            disabled={projects.current_page === projects.last_page}
                            onClick={() => router.get('/projects', { page: projects.current_page + 1, search })}
                            className="rounded border px-3 py-1 disabled:opacity-50"
                        >
                            {t('common.next', 'Next')}
                        </button>
                    </div>
                )}
            </div>

            {/* Create Dialog */}
            {showCreate && <CreateProjectDialog onClose={() => setShowCreate(false)} />}
        </AppLayout>
    );
}

function CreateProjectDialog({ onClose }: { onClose: () => void }) {
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
            onSuccess: () => onClose(),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold">{t('extensions.projects.create', 'New Project')}</h3>
                <form onSubmit={submit} className="mt-4 space-y-4">
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
                            rows={3}
                            className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">{t('extensions.projects.col_status', 'Status')}</label>
                            <select
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                                className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                            >
                                <option value="active">Active</option>
                                <option value="on_hold">On Hold</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">{t('extensions.projects.col_visibility', 'Visibility')}</label>
                            <select
                                value={form.visibility}
                                onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                                className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                            >
                                <option value="private">Private</option>
                                <option value="public">Public</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium">{t('extensions.projects.col_deadline', 'Deadline')}</label>
                        <input
                            type="date"
                            value={form.deadline}
                            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                            className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                            {t('common.cancel', 'Cancel')}
                        </button>
                        <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                            {t('common.create', 'Create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
