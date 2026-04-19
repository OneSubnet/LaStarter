import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Calendar, FolderKanban, PlusCircle } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import Guard from '@/components/guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';

type Project = {
    id: number;
    name: string;
    description: string | null;
    status: string;
    priority: string;
    due_date: string | null;
    color: string | null;
    created_at: string;
};

const priorityConfig: Record<string, { label: string; className: string }> = {
    high: { label: 'High', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    low: { label: 'Low', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
};

const statusConfig: Record<string, { label: string; className: string }> = {
    active: { label: 'Active', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    completed: { label: 'Completed', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    archived: { label: 'Archived', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

export default function ProjectIndex({ projects }: { projects: Project[] }) {
    const page = usePage();
    const teamSlug = (page.props.currentTeam as { slug: string })?.slug ?? '';
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        name: '',
        description: '',
        priority: 'medium' as string,
        due_date: '' as string,
        color: '' as string,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(`/${teamSlug}/projects`, {
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Projects',
                    href: `/${teamSlug}/projects`,
                },
            ]}
        >
            <Head title="Projects" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Projects</h1>
                        <p className="text-sm text-muted-foreground">
                            {projects.length} project{projects.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <Guard permission="project.create">
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <PlusCircle className="mr-1.5 h-4 w-4" />
                                    New Project
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create Project</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={submit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) =>
                                                setData('name', e.target.value)
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">
                                            Description
                                        </Label>
                                        <Input
                                            id="description"
                                            value={data.description}
                                            onChange={(e) =>
                                                setData(
                                                    'description',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="priority">Priority</Label>
                                            <select
                                                id="priority"
                                                value={data.priority}
                                                onChange={(e) =>
                                                    setData('priority', e.target.value)
                                                }
                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="due_date">Due date</Label>
                                            <Input
                                                id="due_date"
                                                type="date"
                                                value={data.due_date}
                                                onChange={(e) =>
                                                    setData('due_date', e.target.value)
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="color">Color</Label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                id="color"
                                                type="color"
                                                value={data.color || '#3b82f6'}
                                                onChange={(e) =>
                                                    setData('color', e.target.value)
                                                }
                                                className="h-9 w-12 cursor-pointer rounded border border-input"
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                Optional label color
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                    >
                                        Create
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </Guard>
                </div>

                {projects.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <FolderKanban className="mb-4 h-12 w-12 text-muted-foreground" />
                            <p className="text-muted-foreground">
                                No projects yet. Create your first project to get started.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {projects.map((project) => {
                            const priority = priorityConfig[project.priority] ?? priorityConfig.medium;
                            const status = statusConfig[project.status] ?? statusConfig.active;

                            return (
                                <Link
                                    key={project.id}
                                    href={`/${teamSlug}/projects/${project.id}`}
                                >
                                    <Card className="transition-shadow hover:shadow-md">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-2">
                                                    {project.color && (
                                                        <div
                                                            className="size-3 rounded-full shrink-0"
                                                            style={{ backgroundColor: project.color }}
                                                        />
                                                    )}
                                                    <CardTitle className="text-base">
                                                        {project.name}
                                                    </CardTitle>
                                                </div>
                                                <Badge
                                                    variant="secondary"
                                                    className={status.className}
                                                >
                                                    {status.label}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {project.description && (
                                                <p className="line-clamp-2 text-sm text-muted-foreground">
                                                    {project.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge
                                                    variant="outline"
                                                    className={priority.className}
                                                >
                                                    {priority.label}
                                                </Badge>
                                                {project.due_date && (
                                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(project.due_date).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
