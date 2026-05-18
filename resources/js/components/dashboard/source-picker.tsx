import { Check, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerFooter,
} from '@/components/ui/drawer';
import type { ChartType, WidgetConfig } from '@/types/dashboard';

const CHART_TYPES: Array<{ value: ChartType; labelKey: string }> = [
    { value: 'composed', labelKey: 'dashboard.chart_composed' },
    { value: 'area', labelKey: 'dashboard.chart_area' },
    { value: 'bar', labelKey: 'dashboard.chart_bar' },
    { value: 'line', labelKey: 'dashboard.chart_line' },
];

const CATEGORY_ORDER = ['Team', 'Activity', 'Notifications', 'Security', 'System'];

const WIDGET_CATEGORIES: Record<string, string> = {
    'core-team-members': 'Team',
    'core-online-members': 'Team',
    'core-member-activity': 'Team',
    'core-member-joins': 'Team',
    'core-onboarding-progress': 'Team',
    'core-activity': 'Activity',
    'core-audit-by-module': 'Activity',
    'core-top-actions': 'Activity',
    'core-unread-notifications': 'Notifications',
    'core-notification-response': 'Notifications',
    'core-notification-types': 'Notifications',
    'core-security-overview': 'Security',
    'core-session-trend': 'Security',
    'core-permission-coverage': 'Security',
    'core-active-extensions': 'System',
    'core-team-roles': 'System',
};

type SourcePickerProps = {
    availableSources: WidgetConfig[];
    existingSources: string[];
    existingChartType?: ChartType;
    onConfirm: (sources: string[], chartType: ChartType) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function SourcePicker({ availableSources, existingSources, existingChartType, onConfirm, open, onOpenChange }: SourcePickerProps) {
    const { t } = useTranslation();
    const [selected, setSelected] = useState<Set<string>>(new Set(existingSources));
    const [chartType, setChartType] = useState<ChartType>(existingChartType ?? 'composed');
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (open) {
            setSelected(new Set(existingSources));
            setChartType(existingChartType ?? 'composed');
            setSearch('');
        }
    }, [open, existingSources, existingChartType]);

    const filtered = useMemo(() => {
        if (!search.trim()) {
return availableSources;
}

        const q = search.toLowerCase();

        return availableSources.filter(
            (w) => w.label.toLowerCase().includes(q) || w.identifier.toLowerCase().includes(q),
        );
    }, [availableSources, search]);

    const grouped = useMemo(() => {
        const groups: Record<string, WidgetConfig[]> = {};

        for (const w of filtered) {
            const key = WIDGET_CATEGORIES[w.identifier] ?? 'Other';
            (groups[key] ??= []).push(w);
        }

        const ordered: Record<string, WidgetConfig[]> = {};

        for (const cat of CATEGORY_ORDER) {
            if (groups[cat]) {
ordered[cat] = groups[cat];
}
        }

        return ordered;
    }, [filtered]);

    const toggleSource = (identifier: string) => {
        setSelected((prev) => {
            const next = new Set(prev);

            if (next.has(identifier)) {
                next.delete(identifier);
            } else if (next.size < 4) {
                next.add(identifier);
            }

            return next;
        });
    };

    const handleConfirm = () => {
        if (selected.size === 0) {
return;
}

        onConfirm(Array.from(selected), chartType);
    };

    const countLabel = `${selected.size}/4`;

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[85vh]">
                <DrawerHeader>
                    <DrawerTitle>{t('dashboard.source_picker_title')}</DrawerTitle>
                </DrawerHeader>
                <div className="px-4 pb-2">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            placeholder={t('dashboard.search_sources', 'Search data sources...')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="border-input bg-background h-9 w-full rounded-md border px-3 pl-9 text-sm"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    {Object.entries(grouped).map(([category, widgets]) => (
                        <div key={category} className="mb-4">
                            <h3 className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wider">
                                {category}
                            </h3>
                            <div className="space-y-1">
                                {widgets.map((widget) => {
                                    const isSelected = selected.has(widget.identifier);
                                    const isFull = selected.size >= 4 && !isSelected;

                                    return (
                                        <button
                                            key={widget.identifier}
                                            type="button"
                                            disabled={isFull}
                                            onClick={() => toggleSource(widget.identifier)}
                                            className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                                                isSelected
                                                    ? 'border-primary bg-primary/5'
                                                    : isFull
                                                      ? 'opacity-50'
                                                      : 'hover:bg-accent'
                                            }`}
                                        >
                                            <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                                isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'
                                            }`}>
                                                {isSelected && <Check className="h-3 w-3" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium">{widget.label}</div>
                                                {widget.description && (
                                                    <div className="text-muted-foreground text-xs">{widget.description}</div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
                <DrawerFooter>
                    <div className="flex items-center gap-3">
                        <select
                            value={chartType}
                            onChange={(e) => setChartType(e.target.value as ChartType)}
                            className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                        >
                            {CHART_TYPES.map((ct) => (
                                <option key={ct.value} value={ct.value}>
                                    {t(ct.labelKey, ct.value)}
                                </option>
                            ))}
                        </select>
                        <div className="text-muted-foreground text-xs">{countLabel}</div>
                        <Button onClick={handleConfirm} disabled={selected.size === 0} className="ml-auto">
                            <Check className="mr-1 h-4 w-4" />
                            {t('dashboard.combine', 'Combine')}
                        </Button>
                    </div>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
