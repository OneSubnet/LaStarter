import { Head, router, usePage } from '@inertiajs/react';
import { CalendarDays, LayoutTemplate, Plus, RefreshCw } from 'lucide-react';
import { type DateRange } from 'react-day-picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { formatDate as fmtDateLib } from '@/lib/format';
import WidgetCanvas from '@/components/dashboard/widget-canvas';
import WidgetPicker from '@/components/dashboard/widget-picker';
import LayoutTemplates from '@/components/dashboard/layout-templates';
import type { DashboardWidget, WidgetLayout, WidgetType } from '@/types/dashboard';

const STORAGE_KEY = 'dashboard_layouts';
const WIDGETS_KEY = 'dashboard_widgets';

interface StoredWidget {
    id: string;
    title: string;
    icon: string;
    type: WidgetType;
    dataSourceId: string;
    chartSubType?: string;
}

function loadFromStorage<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function saveToStorage(key: string, value: unknown) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // ignore quota errors
    }
}

function fmtDate(d: Date): string {
    return fmtDateLib(d.toISOString(), { day: 'numeric', month: 'short' });
}

export default function Dashboard() {
    const { t } = useTranslation();
    const page = usePage();
    const teamSlug = (page.props.currentTeam as { slug: string } | undefined)?.slug ?? '';
    const serverSources = (page.props.widgets as DashboardWidget[] | undefined) ?? [];

    // Build a map from server sources for fast lookup
    const serverMap = new Map(serverSources.map((s) => [s.id, s]));

    // Widgets store metadata + dataSourceId. value is resolved from serverMap.
    const [storedWidgets, setStoredWidgets] = useState<StoredWidget[]>(() => {
        const saved = loadFromStorage<StoredWidget[] | null>(WIDGETS_KEY, null);
        // saved === null → never saved, use defaults. saved === [] → user cleared all, respect it.
        if (saved !== null) return saved;
        return serverSources.map((s) => ({
            id: s.id,
            title: s.title,
            icon: s.icon,
            type: s.type,
            dataSourceId: s.id,
        }));
    });

    const [layouts, setLayouts] = useState<WidgetLayout[]>(() => {
        const saved = loadFromStorage<WidgetLayout[] | null>(STORAGE_KEY, null);
        if (saved !== null) return saved;
        return serverSources.map((w, i) => {
            if (w.type === 'stat') return { i: w.id, x: (i % 4) * 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 };
            if (w.type === 'chart') return { i: w.id, x: 0, y: 2, w: 6, h: 4, minW: 3, minH: 3 };
            return { i: w.id, x: 6, y: 2, w: 6, h: 4, minW: 4, minH: 3 };
        });
    });

    const [pickerOpen, setPickerOpen] = useState(false);
    const [templateOpen, setTemplateOpen] = useState(false);

    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        const now = new Date();
        return { from: new Date(now.getTime() - 90 * 86400000), to: now };
    });

    // Resolve widgets with live server data, adapting to selected display type
    const resolvedWidgets: DashboardWidget[] = storedWidgets.map((sw) => {
        const source = serverMap.get(sw.dataSourceId);
        if (!source) {
            return { id: sw.id, title: sw.title, description: '', icon: sw.icon, type: sw.type, value: null, group: undefined, order: 0 };
        }

        const serverType = source.type;
        const serverValue = source.value;

        // If display type matches server type, use value directly
        if (sw.type === serverType) {
            const value = sw.type === 'chart' && sw.chartSubType
                ? { ...(serverValue as Record<string, unknown>), chartType: sw.chartSubType }
                : serverValue;
            return { id: sw.id, title: sw.title, description: source.description, icon: sw.icon, type: sw.type, value, group: source.group, order: source.order };
        }

        // Adapt stat → chart: wrap single value into a chart-compatible format
        if (sw.type === 'chart' && serverType === 'stat') {
            const statVal = serverValue as { value: number; label?: string } | null;
            return {
                id: sw.id, title: sw.title, description: source.description, icon: sw.icon, type: 'chart' as WidgetType,
                value: { chartType: sw.chartSubType ?? 'bar', data: [{ name: sw.title, value: statVal?.value ?? 0 }] },
                group: source.group, order: source.order,
            };
        }

        // Adapt chart → stat: extract total/count
        if (sw.type === 'stat' && serverType === 'chart') {
            const chartVal = serverValue as { data?: { value?: number }[] } | null;
            const total = chartVal?.data?.reduce((s: number, d: { value?: number }) => s + (d.value ?? 0), 0) ?? 0;
            return {
                id: sw.id, title: sw.title, description: source.description, icon: sw.icon, type: 'stat' as WidgetType,
                value: { value: total, label: source.title },
                group: source.group, order: source.order,
            };
        }

        // Adapt table → stat: count rows
        if (sw.type === 'stat' && serverType === 'table') {
            const tableVal = serverValue as { rows?: unknown[] } | null;
            return {
                id: sw.id, title: sw.title, description: source.description, icon: sw.icon, type: 'stat' as WidgetType,
                value: { value: tableVal?.rows?.length ?? 0, label: source.title },
                group: source.group, order: source.order,
            };
        }

        // Fallback: use server value as-is
        return { id: sw.id, title: sw.title, description: source.description, icon: sw.icon, type: sw.type, value: serverValue, group: source.group, order: source.order };
    });

    // Persist layouts & widget metadata on change
    useEffect(() => {
        saveToStorage(STORAGE_KEY, layouts);
    }, [layouts]);

    useEffect(() => {
        saveToStorage(WIDGETS_KEY, storedWidgets);
    }, [storedWidgets]);

    // Reload server data when date range changes
    useEffect(() => {
        if (!dateRange?.from) return;
        const params = new URLSearchParams();
        params.set('from', dateRange.from.toISOString().slice(0, 10));
        if (dateRange.to) params.set('to', dateRange.to.toISOString().slice(0, 10));
        router.reload({ only: ['widgets'], data: Object.fromEntries(params) });
    }, [dateRange]);

    // Auto-refresh every 60s
    const refreshRef = useRef<ReturnType<typeof setInterval>>(null);
    useEffect(() => {
        refreshRef.current = setInterval(() => {
            router.reload({ only: ['widgets'] });
        }, 60000);
        return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
    }, []);

    const handleAddWidget = useCallback((widget: DashboardWidget) => {
        const stored: StoredWidget = {
            id: widget.id,
            title: widget.title,
            icon: widget.icon,
            type: widget.type,
            dataSourceId: '',
        };
        setStoredWidgets((prev) => [...prev, stored]);
        setLayouts((prev) => [
            ...prev,
            {
                i: stored.id,
                x: 0,
                y: Infinity,
                w: widget.type === 'stat' ? 3 : 6,
                h: widget.type === 'stat' ? 2 : 4,
                minW: 2,
                minH: 2,
            },
        ]);
        setPickerOpen(false);
    }, []);

    const handleRemoveWidget = useCallback((id: string) => {
        setStoredWidgets((prev) => prev.filter((w) => w.id !== id));
        setLayouts((prev) => prev.filter((l) => l.i !== id));
    }, []);

    const handleDuplicateWidget = useCallback((id: string) => {
        setStoredWidgets((prev) => {
            const source = prev.find((w) => w.id === id);
            if (!source) return prev;
            const newId = `${source.id}-copy-${Date.now()}`;
            const dup: StoredWidget = { ...source, id: newId };
            setLayouts((prevLayouts) => {
                const sourceLayout = prevLayouts.find((l) => l.i === id);
                return [
                    ...prevLayouts,
                    {
                        i: newId,
                        x: (sourceLayout?.x ?? 0) + 2,
                        y: Infinity,
                        w: sourceLayout?.w ?? (source.type === 'stat' ? 3 : 6),
                        h: sourceLayout?.h ?? (source.type === 'stat' ? 2 : 4),
                        minW: 2,
                        minH: 2,
                    },
                ];
            });
            return [...prev, dup];
        });
    }, []);

    const handleConfigureWidget = useCallback((id: string, displayType: WidgetType, dataSourceId: string, chartSubType?: string) => {
        setStoredWidgets((prev) =>
            prev.map((w) =>
                w.id === id
                    ? { ...w, type: displayType, dataSourceId, chartSubType, title: serverMap.get(dataSourceId)?.title ?? w.title, icon: serverMap.get(dataSourceId)?.icon ?? w.icon }
                    : w,
            ),
        );
    }, [serverMap]);

    const handleApplyTemplate = useCallback((templateWidgets: DashboardWidget[], templateLayouts: WidgetLayout[]) => {
        const newStored: StoredWidget[] = templateWidgets.map((w) => ({
            id: w.id,
            title: w.title,
            icon: w.icon,
            type: w.type,
            dataSourceId: w.id,
        }));
        setStoredWidgets(newStored);
        setLayouts(templateLayouts);
        setTemplateOpen(false);
    }, []);

    const handleRefresh = useCallback(() => {
        router.reload({
            only: ['widgets'],
            onSuccess: () => toast.success(t('dashboard.refreshed')),
        });
    }, [t]);

    const dateLabel = dateRange?.from
        ? dateRange.to
            ? `${fmtDate(dateRange.from)} — ${fmtDate(dateRange.to)}`
            : fmtDate(dateRange.from)
        : t('dashboard.toolbar.pick_date');

    const headerActions = (
        <>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                        <CalendarDays className="h-4 w-4" />
                        <span className="hidden sm:inline">{dateLabel}</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <div className="flex gap-1 border-b px-3 py-2">
                        {([
                            { key: '7d', from: new Date(Date.now() - 7 * 86400000) },
                            { key: '30d', from: new Date(Date.now() - 30 * 86400000) },
                            { key: '90d', from: new Date(Date.now() - 90 * 86400000) },
                            { key: 'ytd', from: new Date(new Date().getFullYear(), 0, 1) },
                            { key: 'all', from: null },
                        ] as const).map((preset) => (
                            <Button
                                key={preset.key}
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => setDateRange(preset.from ? { from: preset.from, to: new Date() } : undefined)}
                            >
                                {t(`dashboard.periods.${preset.key}`)}
                            </Button>
                        ))}
                    </div>
                    <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setTemplateOpen(true)}>
                <LayoutTemplate className="h-4 w-4" />
                <span className="hidden sm:inline">{t('dashboard.toolbar.templates')}</span>
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => setPickerOpen(true)}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{t('dashboard.toolbar.add_widget')}</span>
            </Button>
        </>
    );

    return (
        <AppLayout
            breadcrumbs={[{ title: t('dashboard.breadcrumb'), href: teamSlug ? dashboard(teamSlug) : '/' }]}
            headerActions={headerActions}
        >
            <Head title={t('dashboard.title')} />

            {resolvedWidgets.length > 0 ? (
                <WidgetCanvas
                    widgets={resolvedWidgets}
                    layouts={layouts}
                    serverSources={serverSources}
                    onLayoutChange={setLayouts}
                    onRemoveWidget={handleRemoveWidget}
                    onDuplicateWidget={handleDuplicateWidget}
                    onConfigureWidget={handleConfigureWidget}
                />
            ) : (
                <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
                    <div className="rounded-full bg-muted p-4">
                        <Plus className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium">{t('dashboard.empty_title')}</h3>
                        <p className="text-sm text-muted-foreground">{t('dashboard.empty_desc')}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setTemplateOpen(true)}>
                            <LayoutTemplate className="mr-2 h-4 w-4" />
                            {t('dashboard.toolbar.templates')}
                        </Button>
                        <Button onClick={() => setPickerOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('dashboard.add_widget')}
                        </Button>
                    </div>
                </div>
            )}

            <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t('dashboard.add_widget')}</DialogTitle>
                    </DialogHeader>
                    <WidgetPicker onSelect={handleAddWidget} />
                </DialogContent>
            </Dialog>

            <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{t('dashboard.templates.title')}</DialogTitle>
                    </DialogHeader>
                    <LayoutTemplates onSelect={handleApplyTemplate} />
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
