import { Head, router, usePage } from '@inertiajs/react';
import {
    CircleDot,
    X,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

type Question = {
    id: number;
    type: string;
    label: string;
    description: string | null;
    options: { label: string; value: string }[] | null;
    required: boolean;
};

type FormData = {
    id: number;
    title: string;
    description: string | null;
    questions: Question[];
};

type Props = { form: FormData };

export default function FormSubmit({ form }: Props) {
    const page = usePage();
    const teamSlug = (page.props.currentTeam as { slug: string })?.slug ?? '';
    const [answers, setAnswers] = useState<Record<number, string>>({});

    const handleChange = (questionId: number, value: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const responses = form.questions.map((q) => ({
            question_id: q.id,
            value: answers[q.id] ?? '',
        }));
        router.post(`/${teamSlug}/forms/${form.id}/submit`, { responses });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Forms', href: `/${teamSlug}/forms` },
                { title: form.title, href: '#' },
            ]}
        >
            <Head title={form.title} />

            <div className="mx-auto max-w-2xl space-y-6 p-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">{form.title}</CardTitle>
                        {form.description && (
                            <p className="text-sm text-muted-foreground">
                                {form.description}
                            </p>
                        )}
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            {form.questions.map((question, index) => (
                                <div key={question.id} className="space-y-2">
                                    <Label className="text-base">
                                        {index + 1}. {question.label}
                                        {question.required && (
                                            <span className="ml-1 text-destructive">*</span>
                                        )}
                                    </Label>
                                    {question.description && (
                                        <p className="text-sm text-muted-foreground">
                                            {question.description}
                                        </p>
                                    )}
                                    <QuestionInput
                                        question={question}
                                        value={answers[question.id] ?? ''}
                                        onChange={(value) => handleChange(question.id, value)}
                                    />
                                </div>
                            ))}
                            <Button type="submit" className="w-full">
                                Submit
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function QuestionInput({
    question,
    value,
    onChange,
}: {
    question: Question;
    value: string;
    onChange: (value: string) => void;
}) {
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
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required={question.required}
                    placeholder={`Enter ${question.type === 'text' ? 'your answer' : question.type}...`}
                />
            );
        case 'textarea':
            return (
                <Textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required={question.required}
                    placeholder="Enter your answer..."
                    rows={3}
                />
            );
        case 'select':
            return (
                <Select value={value} onValueChange={onChange}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an option..." />
                    </SelectTrigger>
                    <SelectContent>
                        {question.options?.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        case 'radio':
            return (
                <div className="space-y-2">
                    {question.options?.map((opt) => (
                        <label
                            key={opt.value}
                            className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                            <input
                                type="radio"
                                name={`question-${question.id}`}
                                value={opt.value}
                                checked={value === opt.value}
                                onChange={() => onChange(opt.value)}
                                className="accent-primary"
                            />
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
                            className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                value={opt.value}
                                className="accent-primary"
                            />
                            {opt.label}
                        </label>
                    ))}
                </div>
            );
        case 'date':
            return (
                <Input
                    type="date"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required={question.required}
                />
            );
        case 'yes_no':
            return (
                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        variant={value === 'yes' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onChange('yes')}
                    >
                        <CircleDot className="h-4 w-4 text-primary" />
                        Yes
                    </Button>
                    <Button
                        type="button"
                        variant={value === 'no' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onChange('no')}
                    >
                        <X className="h-4 w-4 text-destructive" />
                        No
                    </Button>
                </div>
            );
        default:
            return (
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required={question.required}
                    placeholder="Enter your answer..."
                />
            );
    }
}
