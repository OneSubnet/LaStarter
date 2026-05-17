import { LinkIcon } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function slugify(str: string): string {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

type SlugInputProps = {
    defaultValue: string;
    prefix?: string;
    url?: string;
    className?: string;
};

export function SlugInput({
    defaultValue,
    prefix,
    url,
    className,
}: SlugInputProps) {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        e.target.value = slugify(e.target.value);
    };

    return (
        <div
            className={cn(
                'flex text-sm text-muted-foreground items-center',
                className,
            )}
        >
            {prefix && <span className="opacity-50">{prefix}</span>}
            <input
                type="text"
                name="slug"
                placeholder="slug"
                defaultValue={defaultValue}
                onChange={handleChange}
                className="outline-none min-w-10"
            />
            {url && (
                <Button variant="ghost" size="icon" asChild>
                    <a target="_blank" href={url}>
                        <LinkIcon className="h-4 w-4" />
                    </a>
                </Button>
            )}
        </div>
    );
}
