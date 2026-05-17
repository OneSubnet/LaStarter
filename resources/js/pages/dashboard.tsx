import { Head, router, usePage } from '@inertiajs/react';
import { Responsive, useContainerWidth, type LayoutItem } from 'react-grid-layout';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import type { SharedData } from '@/types';
import type { WidgetConfig, WidgetInstance, DisplayMode, DateRange, WidgetData } from '@/types/dashboard';
import { WidgetMap } from '@/components/dashboard/widget-map';
import { WidgetPicker } from '@/components/dashboard/widget-picker';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { Button } from '@/components/ui/button';
import { RotateCcw, Star, Plus } from 'lucide-react';

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768 };
const COLS = { lg: 12, md: 8, sm: 4 };
const ROW_HEIGHT = 80;
const MARGIN = 8;
const SAVE_DEBOUNCE = 500;

const DEFAULT_H: Record<DisplayMode, number> = { stat: 1, chart: 3, table: 3 };

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
            if (isInitialRender.current) return;
            if (saveTimer.current) clearTimeout(saveTimer.current);
            saveTimer.current = setTimeout(() => {
                router.put(
                    `/${teamSlug}/dashboard/layout`,
                    {
                        layout: newLayout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h })),
                        widgets: newWidgets.map(({ id, identifier, displayMode }) => ({ id, identifier, displayMode })),
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
            if (saveTimer.current) clearTimeout(saveTimer.current);
        };
    }, []);

    const handleLayoutChange = useCallback(
        (newLayout: readonly LayoutItem[]) => {
            setLayout([...newLayout]);
            persistLayout(newLayout, widgets);
        },
        [widgets, persistLayout],
    );

    const handleRemoveWidget = useCallback(
        (id: string) => {
            const newWidgets = widgets.filter((w) => w.id !== id);
            const newLayout = layout.filter((l) => l.i !== id);
            setWidgets(newWidgets);
            setLayout(newLayout);
            persistLayout(newLayout, newWidgets);
        },
        [widgets, layout, persistLayout],
    );

    const handleAddWidget = useCallback(
        (widget: WidgetInstance) => {
            const config = configMap.get(widget.identifier);
            const maxY = layout.reduce((max, l) => Math.max(max, l.y + l.h), 0);
            const newItem: LayoutItem = {
                i: widget.id,
                x: 0,
                y: maxY,
                w: config?.size?.w ?? 3,
                h: config?.size?.h ?? 2,
            };
            const newWidgets = [...widgets, widget];
            const newLayout = [...layout, newItem];
            setWidgets(newWidgets);
            setLayout(newLayout);
            persistLayout(newLayout, newWidgets);
        },
        [widgets, layout, configMap, persistLayout],
    );

    const handleModeChange = useCallback(
        (widgetId: string, mode: DisplayMode) => {
            const newWidgets = widgets.map((w) =>
                w.id === widgetId ? { ...w, displayMode: mode } : w,
            );
            const newLayout = layout.map((l) =>
                l.i === widgetId ? { ...l, h: DEFAULT_H[mode] } : l,
            );
            setWidgets(newWidgets);
            setLayout(newLayout);
            persistLayout(newLayout, newWidgets);
        },
        [widgets, layout, persistLayout],
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

    const handleReset = useCallback(() => {
        router.delete(`/${teamSlug}/dashboard/layout`);
    }, [teamSlug]);

    const handleSetDefault = useCallback(() => {
        router.post(`/${teamSlug}/dashboard/layout/default`, {}, { preserveScroll: true });
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
            <Button variant="ghost" size="sm" onClick={handleSetDefault}>
                <Star className="mr-1 h-4 w-4" />
                {t('dashboard.set_default')}
            </Button>
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
                                <div key={widget.id} className="h-full">
                                    <WidgetMap
                                        widget={widget}
                                        config={configMap.get(widget.identifier)}
                                        data={widgetData[widget.identifier] ?? null}
                                        onRemove={handleRemoveWidget}
                                        noDataLabel={t('dashboard.widget.no_data')}
                                        onModeChange={handleModeChange}
                                    />
                                </div>
                            ))}
                        </Responsive>
                    )}
                </div>
            )}
        </AppLayout>
    );
}
