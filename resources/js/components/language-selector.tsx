import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages = [
    { value: 'fr', flag: '\u{1F1EB}\u{1F1F7}', label: 'Fran\u00e7ais' },
    { value: 'en', flag: '\u{1F1FA}\u{1F1F8}', label: 'English' },
] as const;

export default function LanguageSelector({ className }: { className?: string }) {
    const { i18n } = useTranslation();

    const current = languages.find((l) => l.value === i18n.language) ?? languages[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className={`gap-1.5 px-2 text-xs text-muted-foreground ${className ?? ''}`}>
                    <Languages className="h-3.5 w-3.5" />
                    <span>{current.flag} {current.label}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.value}
                        onClick={() => i18n.changeLanguage(lang.value)}
                        className={i18n.language === lang.value ? 'bg-accent' : ''}
                    >
                        <span className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span>{lang.label}</span>
                        </span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
