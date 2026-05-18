import { Head, router, usePage } from '@inertiajs/react';
import { RotateCcw, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Responsive, useContainerWidth  } from 'react-grid-layout';
import type {LayoutItem} from 'react-grid-layout';
import { useTranslation } from 'react-i18next';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { SourcePicker } from '@/components/dashboard/source-picker';
import { WidgetMap } from '@/components/dashboard/widget-map';
import { WidgetPicker } from '@/components/dashboard/widget-picker';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { SharedData } from '@/types';
import type { WidgetConfig, WidgetInstance, DisplayMode, DateRange, WidgetData, ChartType } from '@/types/dashboard';

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768 };
const COLS = { lg: 12, md: 8, sm: 4 };
const ROW_HEIGHT = 60;
const MARGIN = 8;
const SAVE_DEBOUNCE = 500;
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const VISIBLE_THRESHOLD = 30 * 1000; // 30 seconds before reload on tab focus

const DEFAULT_H: Record<DisplayMode, number> = { stat: 1, chart: 4, table: 4 };

export default function Dashboard() {
    const { t } = useTranslation();
    const page = usePage<SharedData>();
    const teamSlug = page.props.currentTeam?.slug ?? '';
    const dashboardLayout = page.props.dashboardLayout;

    const [layout, setLayout] = useState<readonly LayoutItem[]>(
        dashboardLayout?.layout ?? [],
    );
    const [widgets, setWidgets] = useState<WidgetInstance[]>(
        dashboardLayout?.widgets ?? [],
    );
    const [pickerOpen, setPickerOpen] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange | null>(null);

    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isInitialRender = useRef(true);
    const widgetsRef = useRef(widgets);
    widgetsRef.current = widgets;
    const layoutRef = useRef(layout);
    layoutRef.current = layout;

    const { width, containerRef, mounted } = useContainerWidth({ initialWidth: 1200 });

    const widgetData = useMemo<Record<string, WidgetData | null>>(
        () => (dashboardLayout?.widgetData as Record<string, WidgetData | null> | undefined) ?? {},
        [dashboardLayout?.widgetData],
    );

    const availableWidgets = useMemo<WidgetConfig[]>(() => {
        const raw = page.props.availableWidgets ?? [];

        return raw.map((w: Record<string, unknown>) => ({
            identifier: w.identifier as string,
            label: w.label as string,
            type: w.type as string,
            size: w.size as { w: number; h: number },
            permission: (w.permission as string) ?? null,
            description: (w.description as string) ?? null,
            modes: (w.modes as DisplayMode[] | undefined) ?? undefined,
        }));
    }, [page.props.availableWidgets]);

    const configMap = useMemo(() => {
        const map = new Map<string, WidgetConfig>();

        for (const w of availableWidgets) {
            map.set(w.identifier, w);
        }

        return map;
    }, [availableWidgets]);

    const persistLayout = useCallback(
        (newLayout: readonly LayoutItem[], newWidgets: WidgetInstance[]) => {
            if (isInitialRender.current) {
return;
}

            if (saveTimer.current) {
clearTimeout(saveTimer.current);
}

            saveTimer.current = setTimeout(() => {
                router.put(
                    `/${teamSlug}/dashboard/layout`,
                    {
                        layout: newLayout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h })),
                        widgets: newWidgets.map(({ id, identifier, displayMode, config }) => ({ id, identifier, displayMode, config: config as Record<string, string | string[] | undefined> | undefined })),
                    },
                    { preserveScroll: true },
                );
            }, SAVE_DEBOUNCE);
        },
        [teamSlug],
    );

    useEffect(() => {
        isInitialRender.current = false;

        return () => {
            if (saveTimer.current) {
clearTimeout(saveTimer.current);
}
        };
    }, []);

    // Auto-refresh widget data every REFRESH_INTERVAL, paused when tab is hidden
    const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastRefresh = useRef<number>(Date.now());

    const startRefreshInterval = useCallback(() => {
        if (refreshTimer.current) {
clearInterval(refreshTimer.current);
}

        refreshTimer.current = setInterval(() => {
            router.reload({ only: ['dashboardLayout'] });
            lastRefresh.current = Date.now();
        }, REFRESH_INTERVAL);
    }, []);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                if (refreshTimer.current) {
                    clearInterval(refreshTimer.current);
                    refreshTimer.current = null;
                }
            } else {
                const elapsed = Date.now() - lastRefresh.current;

                if (elapsed > VISIBLE_THRESHOLD) {
                    router.reload({ only: ['dashboardLayout'] });
                    lastRefresh.current = Date.now();
                }

                startRefreshInterval();
            }
        };

        startRefreshInterval();
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);

            if (refreshTimer.current) {
clearInterval(refreshTimer.current);
}
        };
    }, [startRefreshInterval]);

    const handleLayoutChange = useCallback(
        (newLayout: readonly LayoutItem[]) => {
            setLayout([...newLayout]);
            persistLayout(newLayout, widgetsRef.current);
        },
        [persistLayout],
    );

    const handleRemoveWidget = useCallback(
        (id: string) => {
            if (saveTimer.current) {
clearTimeout(saveTimer.current);
}

            const newWidgets = widgetsRef.current.filter((w) => w.id !== id);
            const newLayout = layoutRef.current.filter((l) => l.i !== id);
            widgetsRef.current = newWidgets;
            layoutRef.current = newLayout;
            setWidgets(newWidgets);
            setLayout(newLayout);
            router.put(
                `/${teamSlug}/dashboard/layout`,
                {
                    layout: newLayout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h })),
                    widgets: newWidgets.map(({ id: wId, identifier, displayMode, config }) => ({ id: wId, identifier, displayMode, config: config as Record<string, string | string[] | undefined> | undefined })),
                },
                { preserveScroll: true },
            );
        },
        [teamSlug],
    );

    const handleAddWidget = useCallback(
        (widget: WidgetInstance) => {
            if (saveTimer.current) {
clearTimeout(saveTimer.current);
}

            const config = configMap.get(widget.identifier);
            const maxY = layoutRef.current.reduce((max, l) => Math.max(max, l.y + l.h), 0);
            const newItem: LayoutItem = {
                i: widget.id,
                x: 0,
                y: maxY,
                w: config?.size?.w ?? 3,
                h: config?.size?.h ?? DEFAULT_H.stat,
            };
            const newWidgets = [...widgetsRef.current, widget];
            const newLayout = [...layoutRef.current, newItem];
            widgetsRef.current = newWidgets;
            layoutRef.current = newLayout;
            setWidgets(newWidgets);
            setLayout(newLayout);
            router.put(
                `/${teamSlug}/dashboard/layout`,
                {
                    layout: newLayout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h })),
                    widgets: newWidgets.map(({ id: wId, identifier, displayMode, config }) => ({ id: wId, identifier, displayMode, config: config as Record<string, string | string[] | undefined> | undefined })),
                },
                { preserveScroll: true },
            );
        },
        [teamSlug, configMap],
    );

    const handleModeChange = useCallback(
        (widgetId: string, mode: DisplayMode) => {
            const newWidgets = widgetsRef.current.map((w) =>
                w.id === widgetId ? { ...w, displayMode: mode } : w,
            );
            const newLayout = layoutRef.current.map((l) =>
                l.i === widgetId ? { ...l, h: DEFAULT_H[mode] } : l,
            );
            setWidgets(newWidgets);
            setLayout(newLayout);
            persistLayout(newLayout, newWidgets);
        },
        [persistLayout],
    );

    const handleDateRangeChange = useCallback(
        (range: DateRange | null) => {
            setDateRange(range);
            router.reload({
                only: ['dashboardLayout'],
                data: range ? { from: range.from, to: range.to } : {},
            });
        },
        [],
    );

    const [combineTarget, setCombineTarget] = useState<string | null>(null);
    const [sourcePickerOpen, setSourcePickerOpen] = useState(false);

    const chartSources = useMemo(
        () => availableWidgets.filter((w) => w.modes?.includes('chart')),
        [availableWidgets],
    );

    const handleCombineRequest = useCallback((widgetId: string) => {
        setCombineTarget(widgetId);
        setSourcePickerOpen(true);
    }, []);

    const handleCombineConfirm = useCallback(
        (sources: string[], chartType: ChartType) => {
            if (combineTarget === null) {
return;
}

            if (saveTimer.current) {
clearTimeout(saveTimer.current);
}

            const newWidgets = widgetsRef.current.map((w) =>
                w.id === combineTarget
                    ? { ...w, identifier: 'combined', displayMode: 'chart' as DisplayMode, config: { sources, chartType } }
                    : w,
            );
            const newLayout = layoutRef.current.map((l) =>
                l.i === combineTarget ? { ...l, h: 4 } : l,
            );

            widgetsRef.current = newWidgets;
            layoutRef.current = newLayout;
            setWidgets(newWidgets);
            setLayout(newLayout);

            router.put(
                `/${teamSlug}/dashboard/layout`,
                {
                    layout: newLayout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h })),
                    widgets: newWidgets.map(({ id, identifier, displayMode, config }) => ({ id, identifier, displayMode, config: config as Record<string, string | string[] | undefined> | undefined })),
                },
                { preserveScroll: true },
            );

            setCombineTarget(null);
            setSourcePickerOpen(false);
        },
        [combineTarget, teamSlug],
    );

    const handleReset = useCallback(() => {
        if (saveTimer.current) {
clearTimeout(saveTimer.current);
}

        widgetsRef.current = [];
        layoutRef.current = [];
        setWidgets([]);
        setLayout([]);
        router.put(
            `/${teamSlug}/dashboard/layout`,
            { layout: [], widgets: [] },
            { preserveScroll: true },
        );
    }, [teamSlug]);

    const activeWidgetIds = widgets.map((w) => w.id);

    const headerActions = (
        <div className="flex items-center gap-1.5">
            <DateRangePicker range={dateRange} onRangeChange={handleDateRangeChange} />
            <WidgetPicker
                availableWidgets={availableWidgets}
                activeWidgetIds={activeWidgetIds}
                onAdd={handleAddWidget}
                open={pickerOpen}
                onOpenChange={setPickerOpen}
            />
            <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="mr-1 h-4 w-4" />
                {t('dashboard.reset_layout')}
            </Button>
        </div>
    );

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: t('dashboard.breadcrumb'),
                    href: teamSlug ? `/${teamSlug}/dashboard` : '/',
                },
            ]}
            headerActions={headerActions}
        >
            <Head title={t('dashboard.title')} />

            {widgets.length === 0 ? (
                <div className="flex min-h-[50vh] items-center justify-center">
                    <div className="text-center">
                        <p className="text-muted-foreground text-lg">{t('dashboard.empty_title')}</p>
                        <p className="text-muted-foreground mt-1 text-sm">{t('dashboard.empty_desc')}</p>
                        <Button variant="outline" className="mt-4" onClick={() => setPickerOpen(true)}>
                            <Plus className="mr-1 h-4 w-4" />
                            {t('dashboard.add_widget')}
                        </Button>
                    </div>
                </div>
            ) : (
                <div ref={containerRef} className="dashboard-grid w-full">
                    {mounted && (
                        <Responsive
                            layouts={{ lg: layout, md: layout, sm: layout }}
                            breakpoints={BREAKPOINTS}
                            cols={COLS}
                            width={width}
                            rowHeight={ROW_HEIGHT}
                            margin={[MARGIN, MARGIN]}
                            containerPadding={[0, 0]}
                            dragConfig={{ enabled: true, handle: '.drag-handle', cancel: '.mode-toggle', bounded: true, threshold: 3 }}
                            resizeConfig={{ enabled: true, handles: ['se'] }}
                            onLayoutChange={handleLayoutChange}
                        >
                            {widgets.map((widget) => (
                                <div key={widget.id}>
                                    <WidgetMap
                                        widget={widget}
                                        config={configMap.get(widget.identifier)}
                                        data={widgetData[widget.id] ?? null}
                                        onRemove={handleRemoveWidget}
                                        noDataLabel={t('dashboard.widget.no_data')}
                                        onModeChange={handleModeChange}
                                        onCombine={handleCombineRequest}
                                        chartSources={chartSources}
                                    />
                                </div>
                            ))}
                        </Responsive>
                    )}
                </div>
            )}

            <SourcePicker
                availableSources={chartSources}
                existingSources={combineTarget
                    ? (widgetsRef.current.find((w) => w.id === combineTarget)?.config as { sources?: string[] } | undefined)?.sources ?? []
                    : []}
                existingChartType={combineTarget
                    ? (widgetsRef.current.find((w) => w.id === combineTarget)?.config as { chartType?: ChartType } | undefined)?.chartType
                    : undefined}
                onConfirm={handleCombineConfirm}
                open={sourcePickerOpen}
                onOpenChange={setSourcePickerOpen}
            />
        </AppLayout>
    );
}
