import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Calendar } from 'lucide-react';
import type { FormEvent } from 'react';
import Guard from '@/components/guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';

type ProjectData = {
    id: number;
    name: string;
    description: string | null;
    status: string;
    priority: string;
    due_date: string | null;
    color: string | null;
    created_at: string;
    updated_at: string;
};

export default function ProjectShow({ project }: { project: ProjectData }) {
    const page = usePage();
    const teamSlug = (page.props.currentTeam as { slug: string })?.slug ?? '';
    const { data, setData, patch, processing } = useForm({
        name: project.name,
        description: project.description ?? '',
        status: project.status,
        priority: project.priority,
        due_date: project.due_date ? project.due_date.split('T')[0] : '',
        color: project.color ?? '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        patch(`/${teamSlug}/projects/${project.id}`);
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Projects',
                    href: `/${teamSlug}/projects`,
                },
                {
                    title: project.name,
                    href: '#',
                },
            ]}
        >
            <Head title={project.name} />

            <div className="space-y-6 p-6">
                <Link
                    href={`/${teamSlug}/projects`}
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back to Projects
                </Link>

                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        {project.color && (
                            <div
                                className="size-4 rounded-full"
                                style={{ backgroundColor: project.color }}
                            />
                        )}
                        <div>
                            <h1 className="text-2xl font-bold">{project.name}</h1>
                            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                                {project.due_date && (
                                    <>
                                        <span>·</span>
                                        <span className="inline-flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5" />
                                            Due {new Date(project.due_date).toLocaleDateString()}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <Guard permission="project.update">
                    <Card>
                        <CardHeader>
                            <CardTitle>Edit Project</CardTitle>
                        </CardHeader>
                        <CardContent>
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
                                        <Label htmlFor="status">Status</Label>
                                        <select
                                            id="status"
                                            value={data.status}
                                            onChange={(e) =>
                                                setData('status', e.target.value)
                                            }
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                        >
                                            <option value="active">Active</option>
                                            <option value="completed">Completed</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </div>
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
                                </div>
                                <div className="grid grid-cols-2 gap-4">
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
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                    >
                                        Save Changes
                                    </Button>
                                    <Guard permission="project.delete">
                                        <Button
                                            variant="destructive"
                                            onClick={() => {
                                                if (
                                                    confirm(
                                                        'Are you sure you want to delete this project?',
                                                    )
                                                ) {
                                                    useForm({}).delete(
                                                        `/${teamSlug}/projects/${project.id}`,
                                                    );
                                                }
                                            }}
                                            type="button"
                                        >
                                            Delete
                                        </Button>
                                    </Guard>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </Guard>
            </div>
        </AppLayout>
    );
}
