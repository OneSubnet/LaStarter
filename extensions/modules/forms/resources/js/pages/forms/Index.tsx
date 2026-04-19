import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FileText, MessageSquare, PlusCircle } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

type Form = {
    id: number;
    title: string;
    description: string | null;
    slug: string;
    status: 'draft' | 'published' | 'closed';
    responses_count: number;
    created_at: string;
    creator: { name: string };
};

type Props = { forms: Form[] };

const statusConfig: Record<
    string,
    { label: string; className: string }
> = {
    draft: {
        label: 'Draft',
        className:
            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    },
    published: {
        label: 'Published',
        className:
            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
    closed: {
        label: 'Closed',
        className:
            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
};

export default function FormIndex({ forms }: Props) {
    const page = usePage();
    const teamSlug = (page.props.currentTeam as { slug: string })?.slug ?? '';
    const [open, setOpen] = useState(false);

    const { data, setData, post, processing, reset } = useForm({
        title: '',
        description: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(`/${teamSlug}/forms`, {
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
                    title: 'Forms',
                    href: `/${teamSlug}/forms`,
                },
            ]}
        >
            <Head title="Forms" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Forms</h1>
                        <p className="text-sm text-muted-foreground">
                            {forms.length} form{forms.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <Guard permission="form.create">
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <PlusCircle className="mr-1.5 h-4 w-4" />
                                    New Form
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create Form</DialogTitle>
                                </DialogHeader>
                                <form
                                    onSubmit={submit}
                                    className="space-y-4"
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Title</Label>
                                        <Input
                                            id="title"
                                            value={data.title}
                                            onChange={(e) =>
                                                setData('title', e.target.value)
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">
                                            Description
                                        </Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                                setData(
                                                    'description',
                                                    e.target.value,
                                                )
                                            }
                                            rows={3}
                                        />
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

                {forms.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                            <p className="text-muted-foreground">
                                No forms yet. Create your first form to get
                                started.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {forms.map((form) => {
                            const status =
                                statusConfig[form.status] ?? statusConfig.draft;

                            return (
                                <Link
                                    key={form.id}
                                    href={`/${teamSlug}/forms/${form.id}`}
                                >
                                    <Card className="transition-shadow hover:shadow-md">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between">
                                                <CardTitle className="text-base">
                                                    {form.title}
                                                </CardTitle>
                                                <Badge
                                                    variant="secondary"
                                                    className={status.className}
                                                >
                                                    {status.label}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {form.description && (
                                                <p className="line-clamp-2 text-sm text-muted-foreground">
                                                    {form.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span className="inline-flex items-center gap-1">
                                                    <MessageSquare className="h-3 w-3" />
                                                    {form.responses_count}{' '}
                                                    response
                                                    {form.responses_count !== 1
                                                        ? 's'
                                                        : ''}
                                                </span>
                                                <span>
                                                    Created{' '}
                                                    {new Date(
                                                        form.created_at,
                                                    ).toLocaleDateString()}
                                                </span>
                                                <span>
                                                    by {form.creator.name}
                                                </span>
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
