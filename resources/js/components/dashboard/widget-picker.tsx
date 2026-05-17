import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';
import { BarChart3, Bell, LayoutList, Plus, Search, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { WidgetConfig, WidgetInstance, WidgetPickerProps } from '@/types/dashboard';

const WIDGET_ICONS: Record<string, React.ElementType> = {
    'core-team-members': Users,
    'core-activity': BarChart3,
    'core-unread-notifications': Bell,
};

const DEFAULT_ICON = LayoutList;

export function WidgetPicker({ availableWidgets, activeWidgetIds, onAdd, open, onOpenChange }: WidgetPickerProps) {
    const { t } = useTranslation();
    const [search, setSearch] = useState('');

    const notAdded = useMemo(
        () => availableWidgets.filter((w) => !activeWidgetIds.includes(w.identifier)),
        [availableWidgets, activeWidgetIds],
    );

    const filtered = useMemo(() => {
        if (!search.trim()) return notAdded;
        const q = search.toLowerCase();
        return notAdded.filter(
            (w) => w.label.toLowerCase().includes(q) || w.type.toLowerCase().includes(q) || w.identifier.toLowerCase().includes(q),
        );
    }, [notAdded, search]);

    const grouped = useMemo(() => {
        const groups: Record<string, WidgetConfig[]> = {};
        for (const w of filtered) {
            const key = w.type;
            (groups[key] ??= []).push(w);
        }
        return groups;
    }, [filtered]);

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerTrigger asChild>
                <Button variant="outline" size="sm">
                    <Plus className="mr-1 h-4 w-4" />
                    {t('dashboard.add_widget')}
                </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh]">
                <DrawerHeader>
                    <DrawerTitle>{t('dashboard.widget_picker_title')}</DrawerTitle>
                </DrawerHeader>
                <div className="px-4 pb-2">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder={t('dashboard.search_widgets', 'Search widgets...')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    {filtered.length === 0 && (
                        <p className="text-muted-foreground py-8 text-center text-sm">
                            {notAdded.length === 0
                                ? t('dashboard.widget_picker_empty')
                                : t('dashboard.widget_picker_no_match', 'No widgets match your search.')}
                        </p>
                    )}
                    {Object.entries(grouped).map(([type, widgets]) => (
                        <div key={type} className="mb-4">
                            <h3 className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wider">
                                {type}
                            </h3>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {widgets.map((widget) => {
                                    const Icon = WIDGET_ICONS[widget.identifier] ?? DEFAULT_ICON;
                                    return (
                                        <button
                                            key={widget.identifier}
                                            type="button"
                                            onClick={() => {
                                                onAdd({
                                                    id: widget.identifier,
                                                    identifier: widget.identifier,
                                                });
                                                onOpenChange?.(false);
                                            }}
                                            className="hover:bg-accent flex items-center gap-3 rounded-lg border p-3 text-left transition-colors"
                                        >
                                            <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="block text-sm font-medium truncate">{widget.label}</span>
                                                <span className="text-muted-foreground block text-xs capitalize">{widget.identifier.replace(/-/g, ' ')}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end border-t px-4 py-3">
                    <DrawerClose asChild>
                        <Button variant="ghost" size="sm">{t('dashboard.widget.close', 'Close')}</Button>
                    </DrawerClose>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
