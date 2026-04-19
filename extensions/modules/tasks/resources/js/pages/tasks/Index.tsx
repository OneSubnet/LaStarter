import { Head, Link, router, usePage } from '@inertiajs/react';
import { CheckSquare, Circle, Clock, PlusCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Guard from '@/components/guard';
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
import AppLayout from '@/layouts/app-layout';

type Task = {
    id: number;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    due_date: string | null;
    project: { id: number; name: string } | null;
};

const statusConfig: Record<string, { label: string; color: string }> = {
    todo: { label: 'To Do', color: 'bg-slate-100 text-slate-700' },
    in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
    done: { label: 'Done', color: 'bg-green-100 text-green-700' },
};

const priorityConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    high: { label: 'High', variant: 'destructive' },
    medium: { label: 'Medium', variant: 'secondary' },
    low: { label: 'Low', variant: 'outline' },
};

export default function TaskIndex({ tasks }: { tasks: Task[] }) {
    const { currentTeam } = usePage().props;
    const teamSlug = (currentTeam as { slug: string })?.slug ?? '';
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');

    const handleCreate = () => {
        router.post(
            `/${teamSlug}/tasks`,
            { title, description, priority },
            {
                onSuccess: () => {
                    setOpen(false);
                    setTitle('');
                    setDescription('');
                    setPriority('medium');
                },
            },
        );
    };

    const handleStatusToggle = (task: Task) => {
        const nextStatus = task.status === 'done' ? 'todo' : 'done';
        router.patch(`/${teamSlug}/tasks/${task.id}`, { status: nextStatus }, {
            preserveScroll: true,
        });
    };

    const handleDelete = (taskId: number) => {
        router.delete(`/${teamSlug}/tasks/${taskId}`, { preserveScroll: true });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Tasks', href: `/${teamSlug}/tasks` },
            ]}
        >
            <Head title="Tasks" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Tasks</h1>
                    <Guard permission="task.create">
                        <Button onClick={() => setOpen(true)}>
                            <PlusCircle className="mr-1.5 h-4 w-4" />
                            New Task
                        </Button>
                    </Guard>
                </div>

                {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <CheckSquare className="mb-4 h-12 w-12 opacity-20" />
                        <p className="text-sm">No tasks yet.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {tasks.map((task) => {
                            const status = statusConfig[task.status] || statusConfig.todo;
                            const priority = priorityConfig[task.priority] || priorityConfig.medium;

                            return (
                                <div
                                    key={task.id}
                                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleStatusToggle(task)}
                                        className="shrink-0"
                                    >
                                        {task.status === 'done' ? (
                                            <CheckSquare className="h-5 w-5 text-green-600" />
                                        ) : (
                                            <Circle className="h-5 w-5 text-muted-foreground" />
                                        )}
                                    </button>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className={task.status === 'done' ? 'line-through text-muted-foreground' : 'font-medium'}>
                                                {task.title}
                                            </span>
                                            <Badge variant={priority.variant} className="text-[10px]">
                                                {priority.label}
                                            </Badge>
                                            {task.project && (
                                                <Link
                                                    href={`/${teamSlug}/projects/${task.project.id}`}
                                                    className="text-xs text-muted-foreground hover:underline"
                                                >
                                                    {task.project.name}
                                                </Link>
                                            )}
                                        </div>
                                        {task.description && (
                                            <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                                                {task.description}
                                            </p>
                                        )}
                                    </div>

                                    {task.due_date && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {new Date(task.due_date).toLocaleDateString()}
                                        </div>
                                    )}

                                    <span className={`rounded-full px-2 py-0.5 text-xs ${status.color}`}>
                                        {status.label}
                                    </span>

                                    <Guard permission="task.delete">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDelete(task.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </Guard>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create Task</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="task-title">Title</Label>
                            <Input
                                id="task-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Task title"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && title.trim()) {
                                        e.preventDefault();
                                        handleCreate();
                                    }
                                }}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="task-desc">Description</Label>
                            <Input
                                id="task-desc"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Optional description"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Priority</Label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={!title.trim()}>
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
