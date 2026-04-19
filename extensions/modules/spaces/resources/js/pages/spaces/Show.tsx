import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Activity,
    ArrowLeft,
    Download,
    FileText,
    Globe,
    Lock,
    Mail,
    PlusCircle,
    Shield,
    Trash2,
    UserPlus,
    Users,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import Guard from '@/components/guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';

type SpaceMember = {
    id: number;
    user: { id: number; name: string; email: string };
    role: string;
    joined_at: string;
};

type SpaceDocument = {
    id: number;
    name: string;
    file_type: string;
    status: string;
    requires_signature: boolean;
    uploader: { name: string };
    created_at: string;
};

type ActivityEntry = {
    id: number;
    action: string;
    user: { name: string } | null;
    created_at: string;
    properties: Record<string, any>;
};

type SpaceData = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    visibility: string;
    members: SpaceMember[];
    documents: SpaceDocument[];
    activity: ActivityEntry[];
};

type Props = { space: SpaceData };

const visibilityConfig: Record<
    string,
    { label: string; className: string; icon: typeof Globe }
> = {
    public: {
        label: 'Public',
        className:
            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        icon: Globe,
    },
    restricted: {
        label: 'Restricted',
        className:
            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        icon: Shield,
    },
    private: {
        label: 'Private',
        className:
            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        icon: Lock,
    },
};

const documentStatusConfig: Record<
    string,
    { label: string; className: string }
> = {
    uploaded: {
        label: 'Uploaded',
        className:
            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    pending_signature: {
        label: 'Pending Signature',
        className:
            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    },
    signed: {
        label: 'Signed',
        className:
            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
};

const roleConfig: Record<string, { label: string; className: string }> = {
    admin: {
        label: 'Admin',
        className:
            'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    },
    editor: {
        label: 'Editor',
        className:
            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    viewer: {
        label: 'Viewer',
        className:
            'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    },
};

function getActivityIcon(action: string) {
    if (action.includes('member') || action.includes('join')) return Users;
    if (action.includes('document') || action.includes('upload')) return FileText;
    return Activity;
}

export default function SpaceShow({ space }: Props) {
    const page = usePage();
    const teamSlug =
        (page.props.currentTeam as { slug: string })?.slug ?? '';

    const [editOpen, setEditOpen] = useState(false);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [addMemberOpen, setAddMemberOpen] = useState(false);

    const editForm = useForm({
        name: space.name,
        description: space.description ?? '',
        visibility: space.visibility,
    });

    const uploadForm = useForm({
        name: '',
        file_type: 'pdf',
    });

    const addMemberForm = useForm({
        email: '',
        role: 'viewer',
    });

    const submitEdit = (e: FormEvent) => {
        e.preventDefault();
        editForm.patch(`/${teamSlug}/espaces/${space.slug}`, {
            onSuccess: () => setEditOpen(false),
        });
    };

    const submitUpload = (e: FormEvent) => {
        e.preventDefault();
        uploadForm.post(`/${teamSlug}/espaces/${space.slug}/documents`, {
            onSuccess: () => {
                setUploadOpen(false);
                uploadForm.reset();
            },
        });
    };

    const submitAddMember = (e: FormEvent) => {
        e.preventDefault();
        addMemberForm.post(`/${teamSlug}/espaces/${space.slug}/members`, {
            onSuccess: () => {
                setAddMemberOpen(false);
                addMemberForm.reset();
            },
        });
    };

    const deleteSpace = () => {
        if (confirm('Are you sure you want to delete this space?')) {
            router.delete(`/${teamSlug}/espaces/${space.slug}`);
        }
    };

    const removeMember = (memberId: number) => {
        if (confirm('Remove this member from the space?')) {
            router.delete(
                `/${teamSlug}/espaces/${space.slug}/members/${memberId}`,
            );
        }
    };

    const deleteDocument = (documentId: number) => {
        if (confirm('Delete this document?')) {
            router.delete(
                `/${teamSlug}/espaces/${space.slug}/documents/${documentId}`,
            );
        }
    };

    const visibility = visibilityConfig[space.visibility] ?? visibilityConfig.public;
    const VisibilityIcon = visibility.icon;

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Spaces',
                    href: `/${teamSlug}/espaces`,
                },
                {
                    title: space.name,
                    href: '#',
                },
            ]}
        >
            <Head title={space.name} />

            <div className="space-y-6 p-6">
                <Link
                    href={`/${teamSlug}/espaces`}
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back to Spaces
                </Link>

                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">
                                {space.name}
                            </h1>
                            <Badge
                                variant="secondary"
                                className={visibility.className}
                            >
                                <VisibilityIcon className="mr-1 h-3 w-3" />
                                {visibility.label}
                            </Badge>
                        </div>
                        {space.description && (
                            <p className="mt-1 text-sm text-muted-foreground">
                                {space.description}
                            </p>
                        )}
                    </div>
                    <Guard permission="space.update">
                        <Button
                            variant="outline"
                            onClick={() => setEditOpen(true)}
                        >
                            Edit Space
                        </Button>
                    </Guard>
                </div>

                <Tabs defaultValue="overview">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="documents">
                            Documents
                        </TabsTrigger>
                        <TabsTrigger value="members">Members</TabsTrigger>
                        <TabsTrigger value="activity">Activity</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Members
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2">
                                        <Users className="h-5 w-5 text-muted-foreground" />
                                        <span className="text-2xl font-bold">
                                            {space.members.length}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Documents
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-muted-foreground" />
                                        <span className="text-2xl font-bold">
                                            {space.documents.length}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Documents Tab */}
                    <TabsContent value="documents">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">
                                    Documents
                                </h2>
                                <Guard permission="space.document.create">
                                    <Dialog
                                        open={uploadOpen}
                                        onOpenChange={setUploadOpen}
                                    >
                                        <DialogTrigger asChild>
                                            <Button>
                                                <PlusCircle className="mr-1.5 h-4 w-4" />
                                                Upload Document
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>
                                                    Upload Document
                                                </DialogTitle>
                                            </DialogHeader>
                                            <form
                                                onSubmit={submitUpload}
                                                className="space-y-4"
                                            >
                                                <div className="space-y-2">
                                                    <Label htmlFor="doc-name">
                                                        Document Name
                                                    </Label>
                                                    <Input
                                                        id="doc-name"
                                                        value={
                                                            uploadForm.data.name
                                                        }
                                                        onChange={(e) =>
                                                            uploadForm.setData(
                                                                'name',
                                                                e.target.value,
                                                            )
                                                        }
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="file-type">
                                                        File Type
                                                    </Label>
                                                    <Select
                                                        value={
                                                            uploadForm.data
                                                                .file_type
                                                        }
                                                        onValueChange={(
                                                            value,
                                                        ) =>
                                                            uploadForm.setData(
                                                                'file_type',
                                                                value,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="pdf">
                                                                PDF
                                                            </SelectItem>
                                                            <SelectItem value="docx">
                                                                DOCX
                                                            </SelectItem>
                                                            <SelectItem value="xlsx">
                                                                XLSX
                                                            </SelectItem>
                                                            <SelectItem value="image">
                                                                Image
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <DialogFooter>
                                                    <Button
                                                        type="submit"
                                                        disabled={
                                                            uploadForm.processing
                                                        }
                                                    >
                                                        Upload
                                                    </Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </Guard>
                            </div>

                            {space.documents.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                                        <p className="text-muted-foreground">
                                            No documents in this space yet.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>
                                                    Uploaded by
                                                </TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead className="text-right">
                                                    Actions
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {space.documents.map((doc) => {
                                                const status =
                                                    documentStatusConfig[
                                                        doc.status
                                                    ] ?? documentStatusConfig.uploaded;

                                                return (
                                                    <TableRow key={doc.id}>
                                                        <TableCell className="font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                                {doc.name}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="uppercase text-xs">
                                                                {doc.file_type}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant="secondary"
                                                                className={
                                                                    status.className
                                                                }
                                                            >
                                                                {status.label}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {doc.uploader.name}
                                                        </TableCell>
                                                        <TableCell>
                                                            {new Date(
                                                                doc.created_at,
                                                            ).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <TooltipProvider>
                                                                <div className="inline-flex items-center gap-1">
                                                                    <Tooltip>
                                                                        <TooltipTrigger
                                                                            asChild
                                                                        >
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() =>
                                                                                    window.open(
                                                                                        `/${teamSlug}/espaces/${space.slug}/documents/${doc.id}/download`,
                                                                                    )
                                                                                }
                                                                            >
                                                                                <Download className="h-4 w-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            Download
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                    <Guard permission="space.document.delete">
                                                                        <Tooltip>
                                                                            <TooltipTrigger
                                                                                asChild
                                                                            >
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() =>
                                                                                        deleteDocument(
                                                                                            doc.id,
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                Delete
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </Guard>
                                                                </div>
                                                            </TooltipProvider>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    {/* Members Tab */}
                    <TabsContent value="members">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">
                                    Members
                                </h2>
                                <Guard permission="space.member.add">
                                    <Dialog
                                        open={addMemberOpen}
                                        onOpenChange={setAddMemberOpen}
                                    >
                                        <DialogTrigger asChild>
                                            <Button>
                                                <UserPlus className="mr-1.5 h-4 w-4" />
                                                Add Member
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>
                                                    Add Member
                                                </DialogTitle>
                                            </DialogHeader>
                                            <form
                                                onSubmit={submitAddMember}
                                                className="space-y-4"
                                            >
                                                <div className="space-y-2">
                                                    <Label htmlFor="member-email">
                                                        Email
                                                    </Label>
                                                    <Input
                                                        id="member-email"
                                                        type="email"
                                                        value={
                                                            addMemberForm.data
                                                                .email
                                                        }
                                                        onChange={(e) =>
                                                            addMemberForm.setData(
                                                                'email',
                                                                e.target.value,
                                                            )
                                                        }
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="member-role">
                                                        Role
                                                    </Label>
                                                    <Select
                                                        value={
                                                            addMemberForm.data
                                                                .role
                                                        }
                                                        onValueChange={(
                                                            value,
                                                        ) =>
                                                            addMemberForm.setData(
                                                                'role',
                                                                value,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select role" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="admin">
                                                                Admin
                                                            </SelectItem>
                                                            <SelectItem value="editor">
                                                                Editor
                                                            </SelectItem>
                                                            <SelectItem value="viewer">
                                                                Viewer
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <DialogFooter>
                                                    <Button
                                                        type="submit"
                                                        disabled={
                                                            addMemberForm.processing
                                                        }
                                                    >
                                                        Add Member
                                                    </Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </Guard>
                            </div>

                            {space.members.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                                        <p className="text-muted-foreground">
                                            No members in this space yet.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Joined</TableHead>
                                                <TableHead className="text-right">
                                                    Actions
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {space.members.map((member) => {
                                                const role =
                                                    roleConfig[member.role] ??
                                                    roleConfig.viewer;

                                                return (
                                                    <TableRow key={member.id}>
                                                        <TableCell className="font-medium">
                                                            {member.user.name}
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                                                                <Mail className="h-3.5 w-3.5" />
                                                                {
                                                                    member.user
                                                                        .email
                                                                }
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant="secondary"
                                                                className={
                                                                    role.className
                                                                }
                                                            >
                                                                {role.label}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {new Date(
                                                                member.joined_at,
                                                            ).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Guard permission="space.member.remove">
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger
                                                                            asChild
                                                                        >
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() =>
                                                                                    removeMember(
                                                                                        member.id,
                                                                                    )
                                                                                }
                                                                            >
                                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            Remove
                                                                            member
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </Guard>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    {/* Activity Tab */}
                    <TabsContent value="activity">
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold">
                                Recent Activity
                            </h2>

                            {space.activity.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <Activity className="mb-4 h-12 w-12 text-muted-foreground" />
                                        <p className="text-muted-foreground">
                                            No activity recorded yet.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="space-y-0">
                                            {space.activity.map(
                                                (entry, index) => {
                                                    const Icon =
                                                        getActivityIcon(
                                                            entry.action,
                                                        );
                                                    const isLast =
                                                        index ===
                                                        space.activity.length -
                                                            1;

                                                    return (
                                                        <div
                                                            key={entry.id}
                                                            className="flex gap-4"
                                                        >
                                                            <div className="flex flex-col items-center">
                                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                                                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                                                </div>
                                                                {!isLast && (
                                                                    <div className="w-px flex-1 bg-border" />
                                                                )}
                                                            </div>
                                                            <div className="pb-6">
                                                                <p className="text-sm">
                                                                    <span className="font-medium">
                                                                        {entry
                                                                            .user
                                                                            ?.name ??
                                                                            'System'}
                                                                    </span>{' '}
                                                                    {
                                                                        entry.action
                                                                    }
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {new Date(
                                                                        entry.created_at,
                                                                    ).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Edit Space Dialog */}
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Space</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={submitEdit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Name</Label>
                                <Input
                                    id="edit-name"
                                    value={editForm.data.name}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-description">
                                    Description
                                </Label>
                                <Input
                                    id="edit-description"
                                    value={editForm.data.description}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'description',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-visibility">
                                    Visibility
                                </Label>
                                <Select
                                    value={editForm.data.visibility}
                                    onValueChange={(value) =>
                                        editForm.setData('visibility', value)
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
                            <DialogFooter>
                                <Button
                                    type="submit"
                                    disabled={editForm.processing}
                                >
                                    Save Changes
                                </Button>
                                <Guard permission="space.delete">
                                    <Button
                                        variant="destructive"
                                        type="button"
                                        onClick={deleteSpace}
                                    >
                                        Delete Space
                                    </Button>
                                </Guard>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
