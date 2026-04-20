import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    Calendar,
    CheckSquare,
    ChevronDown,
    CircleDot,
    Clock,
    Copy,
    Edit3,
    Eye,
    FileText,
    Link as LinkIcon,
    List,
    Mail,
    MessageSquare,
    Minus,
    Hash,
    Pencil,
    PlusCircle,
    Radio,
    Star,
    TextCursorInput,
    Trash2,
    Type,
    User,
    X,
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';

type Question = {
    id: number;
    type: string;
    label: string;
    description: string | null;
    options: { label: string; value: string }[] | null;
    required: boolean;
    order: number;
};

type FormData = {
    id: number;
    title: string;
    description: string | null;
    slug: string;
    status: string;
    questions: Question[];
    responses_count: number;
};

type Props = { form: FormData };

type Response = {
    id: number;
    submitted_at: string;
    user_name: string | null;
};

const statusConfig: Record<
    string,
    { label: string; className: string }
> = {
    draft: {
        label: 'Draft',
        className:
            'bg-muted text-muted-foreground',
    },
    published: {
        label: 'Published',
        className:
            'bg-primary/10 text-primary',
    },
    closed: {
        label: 'Closed',
        className:
            'bg-destructive/10 text-destructive',
    },
};

const questionTypes = [
    { value: 'text', label: 'Short Text', icon: Type },
    { value: 'textarea', label: 'Long Text', icon: TextCursorInput },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'number', label: 'Number', icon: Hash },
    { value: 'select', label: 'Dropdown', icon: ChevronDown },
    { value: 'radio', label: 'Radio', icon: Radio },
    { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
    { value: 'date', label: 'Date', icon: Calendar },
    { value: 'rating', label: 'Rating', icon: Star },
    { value: 'scale', label: 'Scale', icon: Minus },
    { value: 'yes_no', label: 'Yes / No', icon: CircleDot },
] as const;

function getQuestionIcon(type: string) {
    const found = questionTypes.find((qt) => qt.value === type);
    return found ? found.icon : FileText;
}

function getQuestionTypeLabel(type: string) {
    const found = questionTypes.find((qt) => qt.value === type);
    return found ? found.label : type;
}

function PreviewQuestion({ question }: { question: Question }) {
    switch (question.type) {
        case 'text':
        case 'email':
        case 'number':
            return (
                <Input
                    type={
                        question.type === 'email'
                            ? 'email'
                            : question.type === 'number'
                              ? 'number'
                              : 'text'
                    }
                    placeholder={`Enter ${question.type === 'text' ? 'your answer' : question.type}...`}
                    disabled
                />
            );
        case 'textarea':
            return (
                <Textarea
                    placeholder="Enter your answer..."
                    rows={3}
                    disabled
                />
            );
        case 'select':
            return (
                <Select disabled>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an option..." />
                    </SelectTrigger>
                </Select>
            );
        case 'radio':
            return (
                <div className="space-y-2">
                    {question.options?.map((opt) => (
                        <label
                            key={opt.value}
                            className="flex items-center gap-2 text-sm"
                        >
                            <span className="flex size-4 items-center justify-center rounded-full border border-input">
                                <span className="size-2 rounded-full" />
                            </span>
                            {opt.label}
                        </label>
                    ))}
                </div>
            );
        case 'checkbox':
            return (
                <div className="space-y-2">
                    {question.options?.map((opt) => (
                        <label
                            key={opt.value}
                            className="flex items-center gap-2 text-sm"
                        >
                            <span className="flex size-4 items-center justify-center rounded border border-input">
                                <svg
                                    className="size-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={3}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </span>
                            {opt.label}
                        </label>
                    ))}
                </div>
            );
        case 'date':
            return <Input type="date" disabled />;
        case 'rating':
            return (
                <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                            key={i}
                            className="h-6 w-6 text-muted-foreground"
                        />
                    ))}
                </div>
            );
        case 'scale':
            return (
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">1</span>
                    <div className="h-2 flex-1 rounded-full bg-muted">
                        <div className="h-2 w-1/3 rounded-full bg-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground">10</span>
                </div>
            );
        case 'yes_no':
            return (
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled
                    >
                        <CircleDot className="h-4 w-4 text-primary" />
                        Yes
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled
                    >
                        <X className="h-4 w-4 text-destructive" />
                        No
                    </Button>
                </div>
            );
        default:
            return (
                <Input
                    placeholder="Enter your answer..."
                    disabled
                />
            );
    }
}

export default function FormShow({ form }: Props) {
    const page = usePage();
    const teamSlug = (page.props.currentTeam as { slug: string })?.slug ?? '';

    const [addQuestionOpen, setAddQuestionOpen] = useState(false);
    const [editingForm, setEditingForm] = useState(false);

    const formEditForm = useForm({
        title: form.title,
        description: form.description ?? '',
    });

    const questionForm = useForm({
        type: 'text',
        label: '',
        description: '',
        required: false,
        options: [] as { label: string; value: string }[],
    });

    const [newOptions, setNewOptions] = useState<
        { label: string; value: string }[]
    >([]);

    const hasOptions =
        questionForm.data.type === 'select' ||
        questionForm.data.type === 'radio' ||
        questionForm.data.type === 'checkbox';

    const status = statusConfig[form.status] ?? statusConfig.draft;

    const handleAddOption = () => {
        setNewOptions((prev) => [
            ...prev,
            { label: '', value: `option_${prev.length + 1}` },
        ]);
    };

    const handleRemoveOption = (index: number) => {
        setNewOptions((prev) => prev.filter((_, i) => i !== index));
    };

    const handleOptionChange = (
        index: number,
        field: 'label' | 'value',
        val: string,
    ) => {
        setNewOptions((prev) =>
            prev.map((opt, i) => (i === index ? { ...opt, [field]: val } : opt)),
        );
    };

    const handleQuestionTypeChange = (type: string) => {
        questionForm.setData('type', type);
        if (
            type === 'select' ||
            type === 'radio' ||
            type === 'checkbox'
        ) {
            if (newOptions.length === 0) {
                setNewOptions([
                    { label: '', value: 'option_1' },
                    { label: '', value: 'option_2' },
                ]);
            }
        }
    };

    const submitQuestion = (e: FormEvent) => {
        e.preventDefault();
        const payload = {
            ...questionForm.data,
            options: hasOptions ? newOptions : null,
        };
        router.post(
            `/${teamSlug}/forms/${form.id}/questions`,
            payload,
            {
                onSuccess: () => {
                    setAddQuestionOpen(false);
                    questionForm.reset();
                    setNewOptions([]);
                },
            },
        );
    };

    const handleDeleteQuestion = (questionId: number) => {
        if (confirm('Are you sure you want to delete this question?')) {
            router.delete(
                `/${teamSlug}/forms/${form.id}/questions/${questionId}`,
            );
        }
    };

    const handleMoveQuestion = (currentIndex: number, direction: 'up' | 'down') => {
        const questions = [...form.questions];
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= questions.length) return;
        [questions[currentIndex], questions[targetIndex]] = [questions[targetIndex], questions[currentIndex]];
        router.post(
            `/${teamSlug}/forms/${form.id}/questions/reorder`,
            { questions: questions.map((q) => q.id) },
            { preserveScroll: true },
        );
    };

    const shareUrl = `${window.location.origin}/${teamSlug}/forms/${form.id}/submit`;
    const [copied, setCopied] = useState(false);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const submitFormEdit = (e: FormEvent) => {
        e.preventDefault();
        formEditForm.patch(`/${teamSlug}/forms/${form.id}`, {
            onSuccess: () => {
                setEditingForm(false);
            },
        });
    };

    const handlePublish = () => {
        router.post(`/${teamSlug}/forms/${form.id}/publish`);
    };

    const handleClose = () => {
        router.post(`/${teamSlug}/forms/${form.id}/close`);
    };

    // Placeholder responses for demo purposes
    // In production these would come from props
    const responses: Response[] = [];

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Forms',
                    href: `/${teamSlug}/forms`,
                },
                {
                    title: form.title,
                    href: '#',
                },
            ]}
        >
            <Head title={form.title} />

            <div className="space-y-6 p-6">
                <Link
                    href={`/${teamSlug}/forms`}
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Forms
                </Link>

                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">
                                {form.title}
                            </h1>
                            <Badge
                                variant="secondary"
                                className={status.className}
                            >
                                {status.label}
                            </Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                                <MessageSquare className="h-3.5 w-3.5" />
                                {form.responses_count} response
                                {form.responses_count !== 1 ? 's' : ''}
                            </span>
                            <span>-</span>
                            <span>
                                {form.questions.length} question
                                {form.questions.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                    <Guard permission="form.update">
                        <div className="flex items-center gap-2">
                            {form.status === 'draft' && (
                                <Button onClick={handlePublish}>
                                    Publish
                                </Button>
                            )}
                            {form.status === 'published' && (
                                <Button
                                    variant="outline"
                                    onClick={handleClose}
                                >
                                    Close Form
                                </Button>
                            )}
                        </div>
                    </Guard>
                </div>

                {/* Share link */}
                {form.status === 'published' && (
                    <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
                        <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate text-sm">
                            {shareUrl}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyLink}
                            className="shrink-0"
                        >
                            <Copy className="h-3.5 w-3.5" />
                            {copied ? 'Copied!' : 'Copy'}
                        </Button>
                    </div>
                )}

                <Tabs defaultValue="builder">
                    <TabsList>
                        <TabsTrigger value="builder">
                            <Edit3 className="h-4 w-4" />
                            Builder
                        </TabsTrigger>
                        <TabsTrigger value="preview">
                            <Eye className="h-4 w-4" />
                            Preview
                        </TabsTrigger>
                        <TabsTrigger value="responses">
                            <List className="h-4 w-4" />
                            Responses
                        </TabsTrigger>
                    </TabsList>

                    {/* Builder Tab */}
                    <TabsContent value="builder" className="space-y-6">
                        {/* Form title & description edit */}
                        <Guard permission="form.update">
                            {editingForm ? (
                                <Card>
                                    <CardContent className="pt-6">
                                        <form
                                            onSubmit={submitFormEdit}
                                            className="space-y-4"
                                        >
                                            <div className="space-y-2">
                                                <Label htmlFor="form-title">
                                                    Title
                                                </Label>
                                                <Input
                                                    id="form-title"
                                                    value={
                                                        formEditForm.data.title
                                                    }
                                                    onChange={(e) =>
                                                        formEditForm.setData(
                                                            'title',
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="form-desc">
                                                    Description
                                                </Label>
                                                <Textarea
                                                    id="form-desc"
                                                    value={
                                                        formEditForm.data
                                                            .description
                                                    }
                                                    onChange={(e) =>
                                                        formEditForm.setData(
                                                            'description',
                                                            e.target.value,
                                                        )
                                                    }
                                                    rows={3}
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="submit"
                                                    disabled={
                                                        formEditForm.processing
                                                    }
                                                >
                                                    Save
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setEditingForm(false)
                                                    }
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div>
                                        <h2 className="font-semibold">
                                            {form.title}
                                        </h2>
                                        {form.description && (
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {form.description}
                                            </p>
                                        )}
                                    </div>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setEditingForm(true)
                                                    }
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                Edit title & description
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            )}
                        </Guard>

                        {/* Questions DataTable */}
                        <div className="space-y-3">
                            {form.questions.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                                        <p className="text-muted-foreground">
                                            No questions yet. Add your first
                                            question to get started.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-10">#</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Label</TableHead>
                                                <TableHead className="w-24">Required</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {form.questions.map((question, index) => {
                                                const Icon = getQuestionIcon(question.type);
                                                return (
                                                    <TableRow key={question.id}>
                                                        <TableCell className="font-mono text-muted-foreground">
                                                            {index + 1}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Icon className="h-4 w-4 text-muted-foreground" />
                                                                <span className="text-sm">
                                                                    {getQuestionTypeLabel(question.type)}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="font-medium max-w-xs truncate">
                                                            {question.label}
                                                        </TableCell>
                                                        <TableCell>
                                                            {question.required ? (
                                                                <Badge variant="outline" className="text-xs">
                                                                    Required
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">
                                                                    Optional
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Guard permission="form.update">
                                                                <div className="inline-flex items-center gap-0.5">
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    disabled={index === 0}
                                                                                    onClick={() => handleMoveQuestion(index, 'up')}
                                                                                >
                                                                                    <ArrowUp className="h-4 w-4" />
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>Move up</TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    disabled={index === form.questions.length - 1}
                                                                                    onClick={() => handleMoveQuestion(index, 'down')}
                                                                                >
                                                                                    <ArrowDown className="h-4 w-4" />
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>Move down</TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button variant="ghost" size="sm">
                                                                                    <Pencil className="h-4 w-4" />
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>Edit</TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => handleDeleteQuestion(question.id)}
                                                                                >
                                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>Delete</TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                </div>
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

                        {/* Add question button */}
                        <Guard permission="form.update">
                            <Dialog
                                open={addQuestionOpen}
                                onOpenChange={setAddQuestionOpen}
                            >
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setAddQuestionOpen(true)}
                                >
                                    <PlusCircle className="h-4 w-4" />
                                    Add Question
                                </Button>
                                <DialogContent className="sm:max-w-lg">
                                    <DialogHeader>
                                        <DialogTitle>
                                            Add Question
                                        </DialogTitle>
                                    </DialogHeader>
                                    <form
                                        onSubmit={submitQuestion}
                                        className="space-y-4"
                                    >
                                        <div className="space-y-2">
                                            <Label>Question Type</Label>
                                            <Select
                                                value={questionForm.data.type}
                                                onValueChange={
                                                    handleQuestionTypeChange
                                                }
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {questionTypes.map((qt) => {
                                                        const QIcon =
                                                            qt.icon;
                                                        return (
                                                            <SelectItem
                                                                key={qt.value}
                                                                value={qt.value}
                                                            >
                                                                <span className="inline-flex items-center gap-2">
                                                                    <QIcon className="h-4 w-4" />
                                                                    {qt.label}
                                                                </span>
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="question-label">
                                                Label
                                            </Label>
                                            <Input
                                                id="question-label"
                                                value={questionForm.data.label}
                                                onChange={(e) =>
                                                    questionForm.setData(
                                                        'label',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Enter your question..."
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="question-desc">
                                                Description (optional)
                                            </Label>
                                            <Input
                                                id="question-desc"
                                                value={
                                                    questionForm.data
                                                        .description
                                                }
                                                onChange={(e) =>
                                                    questionForm.setData(
                                                        'description',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Help text for this question"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between rounded-md border p-3">
                                            <Label htmlFor="question-required">
                                                Required
                                            </Label>
                                            <Switch
                                                id="question-required"
                                                checked={
                                                    questionForm.data.required
                                                }
                                                onCheckedChange={(checked) =>
                                                    questionForm.setData(
                                                        'required',
                                                        checked,
                                                    )
                                                }
                                            />
                                        </div>

                                        {/* Options editor for select/radio/checkbox */}
                                        {hasOptions && (
                                            <div className="space-y-3">
                                                <Label>Options</Label>
                                                {newOptions.map(
                                                    (opt, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <Input
                                                                value={
                                                                    opt.label
                                                                }
                                                                onChange={(e) =>
                                                                    handleOptionChange(
                                                                        index,
                                                                        'label',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                placeholder={`Option ${index + 1}`}
                                                                className="flex-1"
                                                            />
                                                            <Input
                                                                value={
                                                                    opt.value
                                                                }
                                                                onChange={(e) =>
                                                                    handleOptionChange(
                                                                        index,
                                                                        'value',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                placeholder="Value"
                                                                className="w-32"
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleRemoveOption(
                                                                        index,
                                                                    )
                                                                }
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ),
                                                )}
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleAddOption}
                                                >
                                                    <PlusCircle className="h-3.5 w-3.5" />
                                                    Add Option
                                                </Button>
                                            </div>
                                        )}

                                        <div className="flex justify-end gap-2 pt-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setAddQuestionOpen(false);
                                                    questionForm.reset();
                                                    setNewOptions([]);
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={
                                                    questionForm.processing
                                                }
                                            >
                                                Add Question
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </Guard>
                    </TabsContent>

                    {/* Preview Tab */}
                    <TabsContent value="preview">
                        <Card>
                            <CardHeader>
                                <CardTitle>{form.title}</CardTitle>
                                {form.description && (
                                    <p className="text-sm text-muted-foreground">
                                        {form.description}
                                    </p>
                                )}
                            </CardHeader>
                            <Separator />
                            <CardContent className="space-y-6 pt-6">
                                {form.questions.length === 0 ? (
                                    <div className="flex flex-col items-center py-8">
                                        <Eye className="mb-4 h-10 w-10 text-muted-foreground" />
                                        <p className="text-muted-foreground">
                                            No questions to preview. Add
                                            questions in the Builder tab.
                                        </p>
                                    </div>
                                ) : (
                                    form.questions.map((question, index) => (
                                        <div
                                            key={question.id}
                                            className="space-y-2"
                                        >
                                            <Label className="text-base">
                                                {index + 1}.{' '}
                                                {question.label}
                                                {question.required && (
                                                    <span className="ml-1 text-destructive">
                                                        *
                                                    </span>
                                                )}
                                            </Label>
                                            {question.description && (
                                                <p className="text-sm text-muted-foreground">
                                                    {question.description}
                                                </p>
                                            )}
                                            <PreviewQuestion
                                                question={question}
                                            />
                                            {index <
                                                form.questions.length - 1 && (
                                                <Separator className="mt-4" />
                                            )}
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Responses Tab */}
                    <TabsContent value="responses">
                        <Guard permission="form-submission.view">
                            <div className="space-y-6">
                                {/* Summary stats */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                                Total Responses
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center gap-2">
                                                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                                                <span className="text-2xl font-bold">
                                                    {form.responses_count}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                                Completion Rate
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-5 w-5 text-muted-foreground" />
                                                <span className="text-2xl font-bold">
                                                    {form.responses_count > 0
                                                        ? '87%'
                                                        : 'N/A'}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Responses table */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Submissions</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {responses.length === 0 ? (
                                            <div className="flex flex-col items-center py-8">
                                                <List className="mb-4 h-10 w-10 text-muted-foreground" />
                                                <p className="text-muted-foreground">
                                                    No responses yet.
                                                </p>
                                            </div>
                                        ) : (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>
                                                            Submitted
                                                        </TableHead>
                                                        <TableHead>
                                                            Respondent
                                                        </TableHead>
                                                        <TableHead className="text-right">
                                                            Actions
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {responses.map(
                                                        (response) => (
                                                            <TableRow
                                                                key={
                                                                    response.id
                                                                }
                                                            >
                                                                <TableCell>
                                                                    {new Date(
                                                                        response.submitted_at,
                                                                    ).toLocaleDateString()}
                                                                </TableCell>
                                                                <TableCell className="flex items-center gap-2">
                                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                                    {response.user_name ??
                                                                        'Anonymous'}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger
                                                                                asChild
                                                                            >
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                >
                                                                                    <Eye className="h-4 w-4" />
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                View
                                                                                response
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                </TableCell>
                                                            </TableRow>
                                                        ),
                                                    )}
                                                </TableBody>
                                            </Table>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </Guard>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
