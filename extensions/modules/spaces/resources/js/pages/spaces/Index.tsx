import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FileText, Lock, PlusCircle, Users } from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';

type Space = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    visibility: 'public' | 'restricted' | 'private';
    members_count: number;
    documents_count: number;
    created_at: string;
};

type Props = { spaces: Space[] };

const visibilityConfig: Record<
    string,
    { label: string; className: string }
> = {
    public: {
        label: 'Public',
        className:
            'bg-primary/10 text-primary',
    },
    restricted: {
        label: 'Restricted',
        className:
            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    },
    private: {
        label: 'Private',
        className:
            'bg-destructive/10 text-destructive',
    },
};

export default function SpaceIndex({ spaces }: Props) {
    const page = usePage();
    const teamSlug =
        (page.props.currentTeam as { slug: string })?.slug ?? '';
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        name: '',
        description: '',
        visibility: 'public' as string,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(`/${teamSlug}/spaces`, {
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
                    title: 'Spaces',
                    href: `/${teamSlug}/spaces`,
                },
            ]}
        >
            <Head title="Spaces" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Spaces</h1>
                        <p className="text-sm text-muted-foreground">
                            {spaces.length} space
                            {spaces.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <Guard permission="space.create">
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <PlusCircle className="h-4 w-4" />
                                    New Space
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create Space</DialogTitle>
                                </DialogHeader>
                                <form
                                    onSubmit={submit}
                                    className="space-y-4"
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) =>
                                                setData(
                                                    'name',
                                                    e.target.value,
                                                )
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
                                    <div className="space-y-2">
                                        <Label htmlFor="visibility">
                                            Visibility
                                        </Label>
                                        <Select
                                            value={data.visibility}
                                            onValueChange={(value) =>
                                                setData('visibility', value)
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select visibility" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="public">
                                                    Public
                                                </SelectItem>
                                                <SelectItem value="restricted">
                                                    Restricted
                                                </SelectItem>
                                                <SelectItem value="private">
                                                    Private
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
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

                {spaces.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Lock className="mb-4 h-12 w-12 text-muted-foreground" />
                            <p className="text-muted-foreground">
                                No spaces yet. Create your first space to get
                                started.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {spaces.map((space) => {
                            const visibility =
                                visibilityConfig[space.visibility] ??
                                visibilityConfig.public;

                            return (
                                <Link
                                    key={space.id}
                                    href={`/${teamSlug}/spaces/${space.slug}`}
                                >
                                    <Card className="transition-shadow hover:shadow-md">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between">
                                                <CardTitle className="text-base">
                                                    {space.name}
                                                </CardTitle>
                                                <Badge
                                                    variant="secondary"
                                                    className={
                                                        visibility.className
                                                    }
                                                >
                                                    {visibility.label}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {space.description && (
                                                <p className="line-clamp-2 text-sm text-muted-foreground">
                                                    {space.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span className="inline-flex items-center gap-1">
                                                    <Users className="h-3.5 w-3.5" />
                                                    {space.members_count}{' '}
                                                    member
                                                    {space.members_count !== 1
                                                        ? 's'
                                                        : ''}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <FileText className="h-3.5 w-3.5" />
                                                    {space.documents_count}{' '}
                                                    doc
                                                    {space.documents_count !== 1
                                                        ? 's'
                                                        : ''}
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
