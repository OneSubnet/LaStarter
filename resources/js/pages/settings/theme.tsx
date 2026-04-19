import { Head, router, usePage } from '@inertiajs/react';
import { Check, Paintbrush } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import TeamSettingsLayout from '@/layouts/team-settings-layout';
import { cn } from '@/lib/utils';
import { theme as themeUrl } from '@/routes/settings/team';
import { update as updateTheme } from '@/routes/settings/team/theme';

type Theme = {
    id: number;
    name: string;
    identifier: string;
    description: string;
};

type Props = {
    themes: Theme[];
    activeTheme: string | null;
};

export default function ThemeSettings({ themes, activeTheme }: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';

    const [selectedTheme, setSelectedTheme] = useState<string | null>(
        activeTheme,
    );

    const hasChanges = selectedTheme !== activeTheme;

    const handleSave = () => {
        if (!selectedTheme) {
            return;
        }

        router.patch(updateTheme(teamSlug).url, {
            theme: selectedTheme,
        });
    };

    return (
        <TeamSettingsLayout
            activeTab="Theme"
            breadcrumbs={[
                {
                    title: 'Theme',
                    href: themeUrl(teamSlug).url,
                },
            ]}
        >
            <Head title="Theme" />
            <h1 className="sr-only">Theme</h1>

            <div className="flex flex-col space-y-8">
                <div className="flex items-center justify-between">
                    <Heading
                        variant="small"
                        title="Theme"
                        description="Choose a theme for your team"
                    />

                    {hasChanges && (
                        <Button onClick={handleSave}>
                            <Paintbrush />
                            Apply theme
                        </Button>
                    )}
                </div>

                {themes.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">
                        No themes available.
                    </p>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2">
                        {themes.map((theme) => {
                            const isActive =
                                theme.identifier === activeTheme;
                            const isSelected =
                                theme.identifier === selectedTheme;

                            return (
                                <button
                                    key={theme.id}
                                    type="button"
                                    className={cn(
                                        'group relative flex flex-col rounded-xl border-2 p-0 text-left transition-all hover:shadow-md',
                                        isSelected
                                            ? 'border-primary shadow-sm'
                                            : 'border-border hover:border-foreground/20',
                                    )}
                                    onClick={() =>
                                        setSelectedTheme(theme.identifier)
                                    }
                                >
                                    {isActive && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                                        <Check className="h-4 w-4" />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    Active theme
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}

                                    <div className="flex h-32 items-center justify-center rounded-t-xl bg-gradient-to-br from-muted/80 to-muted">
                                        <div className="flex gap-1.5">
                                            <div className="h-16 w-4 rounded-full bg-foreground/20" />
                                            <div className="flex flex-col gap-1.5">
                                                <div className="h-3 w-20 rounded bg-foreground/15" />
                                                <div className="h-2 w-16 rounded bg-foreground/10" />
                                                <div className="h-2 w-24 rounded bg-foreground/10" />
                                                <div className="mt-2 h-2 w-12 rounded bg-foreground/10" />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <div className="h-3 w-16 rounded bg-foreground/15" />
                                                <div className="h-2 w-20 rounded bg-foreground/10" />
                                                <div className="h-2 w-14 rounded bg-foreground/10" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1 p-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">
                                                {theme.name}
                                            </span>
                                            {isActive && (
                                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        {theme.description && (
                                            <p className="text-sm text-muted-foreground">
                                                {theme.description}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </TeamSettingsLayout>
    );
}
