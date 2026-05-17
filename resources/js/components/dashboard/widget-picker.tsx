import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';
import {
    BarChart3, Bell, BellRing, GraduationCap, Key, Layers, LayoutList,
    MailCheck, Package, Plus, Search, Shield, ShieldCheck, UserCheck,
    UserPlus, Users, Wifi, Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { WidgetConfig, WidgetInstance, WidgetPickerProps } from '@/types/dashboard';

const WIDGET_ICONS: Record<string, React.ElementType> = {
    'core-team-members': Users,
    'core-online-members': Users,
    'core-activity': BarChart3,
    'core-unread-notifications': Bell,
    'core-active-extensions': Package,
    'core-team-roles': Shield,
    'core-member-activity': UserCheck,
    'core-audit-by-module': Layers,
    'core-session-trend': Wifi,
    'core-permission-coverage': Key,
    'core-notification-response': MailCheck,
    'core-onboarding-progress': GraduationCap,
    'core-member-joins': UserPlus,
    'core-top-actions': Zap,
    'core-security-overview': ShieldCheck,
    'core-notification-types': BellRing,
};

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

const CATEGORY_ORDER = ['Team', 'Activity', 'Notifications', 'Security', 'System'];

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
            (w) => w.label.toLowerCase().includes(q) || w.identifier.toLowerCase().includes(q) || (w.description ?? '').toLowerCase().includes(q),
        );
    }, [notAdded, search]);

    const grouped = useMemo(() => {
        const groups: Record<string, WidgetConfig[]> = {};
        for (const w of filtered) {
            const key = WIDGET_CATEGORIES[w.identifier] ?? 'Other';
            (groups[key] ??= []).push(w);
        }
        const ordered: Record<string, WidgetConfig[]> = {};
        for (const cat of CATEGORY_ORDER) {
            if (groups[cat]) ordered[cat] = groups[cat];
        }
        return ordered;
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
                <div className="flex-1 overflow-y-auto px-4 pb-6">
                    {filtered.length === 0 && (
                        <p className="text-muted-foreground py-8 text-center text-sm">
                            {notAdded.length === 0
                                ? t('dashboard.widget_picker_empty')
                                : t('dashboard.widget_picker_no_match', 'No widgets match your search.')}
                        </p>
                    )}
                    {Object.entries(grouped).map(([category, widgets]) => (
                        <div key={category} className="mb-5">
                            <h3 className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wider">
                                {category}
                            </h3>
                            <div className="grid gap-2 grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
                                            className="hover:bg-accent flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors"
                                        >
                                            <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <span className="text-xs font-medium leading-tight">{widget.label}</span>
                                            {widget.description && (
                                                <span className="text-muted-foreground text-[10px] leading-tight">{widget.description}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </DrawerContent>
        </Drawer>
    );
}
