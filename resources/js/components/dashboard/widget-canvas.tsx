import 'react-grid-layout/css/styles.css';

import {
    ArrowDown,
    ArrowUp,
    BarChart3,
    CircleDot,
    Copy,
    Database,
    Hash,
    List,
    MoreVertical,
    Pencil,
    PieChart,
    Radar,
    Target,
    Trash2,
    TrendingUp,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/format';
import { Responsive, WidthProvider, type LayoutItem } from 'react-grid-layout/legacy';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import type { DashboardWidget, WidgetLayout, WidgetType } from '@/types/dashboard';
import WidgetChart from '@/components/dashboard/widget-chart';
import WidgetTable from '@/components/dashboard/widget-table';

const ResponsiveGridLayout = WidthProvider(Responsive);

const COLS: Record<string, number> = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
const ROW_HEIGHT = 60;
const BREAKPOINTS: Record<string, number> = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };

type DataSource = { id: string; label: string; type: WidgetType; group?: string };

// ── Helpers ──

function hasData(widget: DashboardWidget): boolean {
    if (widget.value === null || widget.value === undefined) return false;
    if (widget.type === 'chart') {
        const d = widget.value as { data?: unknown[] };
        return Array.isArray(d?.data) && d.data.length > 0;
    }
    if (widget.type === 'table') {
        const d = widget.value as { rows?: unknown[] };
        return Array.isArray(d?.rows) && d.rows.length > 0;
    }
    return true;
}

// ── Empty state ──

function WidgetEmptyState({ hasDataSource }: { hasDataSource?: boolean }) {
    const { t } = useTranslation();
    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 overflow-hidden p-2 text-center text-muted-foreground/60">
            <Database className="h-6 w-6 shrink-0" />
            <p className="truncate text-xs font-medium">
                {hasDataSource ? t('dashboard.widget.no_data') : t('dashboard.widget.select_dataset')}
            </p>
            {!hasDataSource && (
                <p className="truncate text-[10px]">{t('dashboard.widget.click_configure')}</p>
            )}
        </div>
    );
}

// ── Stat renderer ──

function StatContent({ widget }: { widget: DashboardWidget }) {
    const val = widget.value as { value: number; label?: string; trend?: { direction: 'up' | 'down'; percentage: number } } | number;
    const data = typeof val === 'number' ? { value: val } : val;

    return (
        <div className="flex h-full flex-col justify-center gap-1.5">
            <p className="text-2xl font-bold tabular-nums">
                {typeof data.value === 'number'
                    ? data.value >= 1000
                        ? formatCurrency(data.value)
                        : formatCurrency(data.value)
                    : String(data.value ?? '—')}
            </p>
            {data.label && <p className="truncate text-sm text-muted-foreground">{data.label}</p>}
            {data.trend && (
                <div className={`flex items-center gap-1 text-xs font-medium ${data.trend.direction === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {data.trend.direction === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    {data.trend.percentage}%
                </div>
            )}
        </div>
    );
}

// ── Widget content router ──

function WidgetBody({ widget }: { widget: DashboardWidget }) {
    if (!hasData(widget)) return <WidgetEmptyState hasDataSource={widget.value !== null && widget.value !== undefined} />;

    switch (widget.type) {
        case 'stat': return <StatContent widget={widget} />;
        case 'chart': return <WidgetChart value={widget.value} />;
        case 'table': return <WidgetTable value={widget.value} />;
        default: return <WidgetEmptyState />;
    }
}

// ── Configure sheet (step 1: display type, step 2: data source) ──

type ChartSubType = 'line' | 'bar' | 'pie' | 'donut' | 'radar' | 'radial' | 'bar-label';
type DisplaySelection = { category: WidgetType; chartSubType?: ChartSubType };

const DISPLAY_OPTIONS: { category: WidgetType; label: string; icon: typeof Hash; subTypes?: { id: ChartSubType; label: string; icon: typeof Hash }[] }[] = [
    {
        category: 'stat',
        label: 'dashboard.display_types.number',
        icon: Hash,
    },
    {
        category: 'chart',
        label: 'dashboard.display_types.chart',
        icon: BarChart3,
        subTypes: [
            { id: 'line', label: 'dashboard.widgets.line_chart', icon: TrendingUp },
            { id: 'bar', label: 'dashboard.widgets.bar_chart', icon: BarChart3 },
            { id: 'pie', label: 'dashboard.widgets.pie_chart', icon: PieChart },
            { id: 'donut', label: 'dashboard.widgets.donut_chart', icon: CircleDot },
            { id: 'radar', label: 'dashboard.widgets.radar_chart', icon: Radar },
            { id: 'radial', label: 'dashboard.widgets.radial_chart', icon: Target },
            { id: 'bar-label', label: 'dashboard.widgets.bar_label_chart', icon: BarChart3 },
        ],
    },
    {
        category: 'table',
        label: 'dashboard.display_types.table',
        icon: List,
    },
];

function ConfigureSheet({
    open,
    onClose,
    onApply,
    dataSources,
}: {
    open: boolean;
    onClose: () => void;
    onApply: (displayType: WidgetType, chartSubType: ChartSubType | undefined, dataSourceId: string) => void;
    dataSources: DataSource[];
}) {
    const { t } = useTranslation();
    const [step, setStep] = useState<'display' | 'datasource'>('display');
    const [displaySelection, setDisplaySelection] = useState<DisplaySelection | null>(null);

    const handleClose = () => {
        setStep('display');
        setDisplaySelection(null);
        onClose();
    };

    const grouped = useMemo(() => {
        const map = new Map<string, DataSource[]>();
        for (const ds of dataSources) {
            const key = ds.group ?? '';
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(ds);
        }
        return map;
    }, [dataSources]);

    const groupLabels: Record<string, string> = {
        overview: t('dashboard.datasources.group.overview'),
        crm: t('dashboard.datasources.group.crm'),
        finance: t('dashboard.datasources.group.finance'),
        operations: t('dashboard.datasources.group.operations'),
    };

    return (
        <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
            <SheetContent className="w-full sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>
                        {step === 'display'
                            ? t('dashboard.widget.pick_display')
                            : t('dashboard.widget.pick_datasource')}
                    </SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                    {step === 'display' ? (
                        <div className="grid grid-cols-1 gap-3">
                            {DISPLAY_OPTIONS.map((opt) => (
                                <div key={opt.category} className="space-y-2">
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-4 rounded-xl border bg-card px-5 py-4 text-left shadow-sm transition-all hover:border-primary/30 hover:bg-accent"
                                        onClick={() => {
                                            if (!opt.subTypes) {
                                                setDisplaySelection({ category: opt.category });
                                                setStep('datasource');
                                            }
                                        }}
                                    >
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                            <opt.icon className="h-5 w-5 text-primary" />
                                        </div>
                                        <span className="text-sm font-semibold">{t(opt.label)}</span>
                                    </button>
                                    {opt.subTypes && (
                                        <div className="grid grid-cols-2 gap-2 pl-2">
                                            {opt.subTypes.map((sub) => (
                                                <button
                                                    key={sub.id}
                                                    type="button"
                                                    className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm transition-all hover:border-primary/30 hover:bg-accent"
                                                    onClick={() => {
                                                        setDisplaySelection({ category: opt.category, chartSubType: sub.id });
                                                        setStep('datasource');
                                                    }}
                                                >
                                                    <sub.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                    <span className="font-medium">{t(sub.label)}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        dataSources.length > 0 ? (
                            <div className="max-h-[70vh] space-y-5 overflow-y-auto">
                                {[...grouped.entries()].map(([groupKey, sources]) => (
                                    <div key={groupKey} className="space-y-2">
                                        {groupKey && (
                                            <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                {groupLabels[groupKey] ?? groupKey}
                                            </p>
                                        )}
                                        <div className="grid grid-cols-1 gap-2">
                                            {sources.map((ds) => (
                                                <button
                                                    key={ds.id}
                                                    type="button"
                                                    className="flex items-center gap-4 rounded-xl border bg-card px-5 py-3.5 text-left transition-all hover:border-primary/30 hover:bg-accent"
                                                    onClick={() => {
                                                        if (displaySelection) {
                                                            onApply(displaySelection.category, displaySelection.chartSubType, ds.id);
                                                            handleClose();
                                                        }
                                                    }}
                                                >
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                                        <Database className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <span className="text-sm font-medium">{ds.label}</span>
                                                        <p className="text-xs text-muted-foreground capitalize">{ds.type}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="py-12 text-center text-sm text-muted-foreground">{t('dashboard.widget.no_datasource')}</p>
                        )
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

// ── Main canvas ──

export default function WidgetCanvas({
    widgets,
    layouts,
    serverSources,
    onLayoutChange,
    onRemoveWidget,
    onDuplicateWidget,
    onConfigureWidget,
}: {
    widgets: DashboardWidget[];
    layouts: WidgetLayout[];
    serverSources: DashboardWidget[];
    onLayoutChange: (layouts: WidgetLayout[]) => void;
    onRemoveWidget: (id: string) => void;
    onDuplicateWidget: (id: string) => void;
    onConfigureWidget: (id: string, displayType: WidgetType, dataSourceId: string, chartSubType?: string) => void;
}) {
    const { t } = useTranslation();
    const [contextWidget, setContextWidget] = useState<string | null>(null);
    const [configuringWidget, setConfiguringWidget] = useState<string | null>(null);

    const dataSources: DataSource[] = useMemo(
        () => serverSources.map((s) => ({
            id: s.id,
            label: s.title,
            type: s.type,
            group: s.group,
        })),
        [serverSources],
    );

    const widgetMap = useMemo(
        () => Object.fromEntries(widgets.map((w) => [w.id, w])),
        [widgets],
    );

    const handleLayoutChange = useCallback(
        (layout: readonly LayoutItem[]) => {
            onLayoutChange(
                layout.map((item) => ({
                    i: item.i,
                    x: item.x,
                    y: item.y,
                    w: item.w,
                    h: item.h,
                    minW: 2,
                    minH: 2,
                })),
            );
        },
        [onLayoutChange],
    );

    const handleConfigureApply = useCallback((displayType: WidgetType, chartSubType: string | undefined, dataSourceId: string) => {
        if (configuringWidget) {
            onConfigureWidget(configuringWidget, displayType, dataSourceId, chartSubType);
            setConfiguringWidget(null);
        }
    }, [configuringWidget, onConfigureWidget]);

    if (widgets.length === 0) return null;

    return (
        <div className="-m-4 flex-1 overflow-auto p-3">
            <ResponsiveGridLayout
                layouts={{ lg: layouts as LayoutItem[] }}
                breakpoints={BREAKPOINTS}
                cols={COLS}
                rowHeight={ROW_HEIGHT}
                margin={[12, 12]}
                containerPadding={[8, 8]}
                isDraggable
                isResizable
                resizeHandle={
                    <span className="react-resizable-handle absolute right-0 bottom-0 flex h-5 w-5 cursor-se-resize items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 10 10" className="text-muted-foreground/40">
                            <path d="M9 1L1 9M9 5L5 9M9 9L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </span>
                }
                onLayoutChange={handleLayoutChange as (layout: readonly LayoutItem[]) => void}
                draggableCancel=".widget-context-trigger"
            >
                {layouts.map((layoutItem) => {
                    const widget = widgetMap[layoutItem.i];
                    if (!widget) return null;
                    const isEmpty = !hasData(widget);
                    return (
                        <div
                            key={layoutItem.i}
                            className={`flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm ${isEmpty ? 'cursor-pointer hover:border-primary/30 hover:bg-accent/50' : ''}`}
                            {...(isEmpty ? {
                                onClick: () => setConfiguringWidget(widget.id),
                                onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter') setConfiguringWidget(widget.id); },
                                role: 'button' as const,
                                tabIndex: 0,
                            } : {})}
                        >
                            <div
                                className="flex cursor-grab items-center justify-between border-b px-3 py-2 active:cursor-grabbing"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <span className="text-sm font-medium">{widget.title}</span>
                                <DropdownMenu open={contextWidget === widget.id} onOpenChange={(o) => setContextWidget(o ? widget.id : null)}>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            className="widget-context-trigger rounded p-1 hover:bg-muted"
                                            onClick={(e) => { e.stopPropagation(); setContextWidget(widget.id); }}
                                        >
                                            <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40">
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setConfiguringWidget(widget.id); setContextWidget(null); }}>
                                            <Pencil className="mr-2 h-3.5 w-3.5" />
                                            {t('dashboard.widget.configure')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicateWidget(widget.id); setContextWidget(null); }}>
                                            <Copy className="mr-2 h-3.5 w-3.5" />
                                            {t('dashboard.widget.duplicate')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRemoveWidget(widget.id); setContextWidget(null); }}>
                                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                                            {t('dashboard.widget.delete')}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="min-h-0 flex-1 p-3">
                                <WidgetBody widget={widget} />
                            </div>
                        </div>
                    );
                })}
            </ResponsiveGridLayout>

            <ConfigureSheet
                open={configuringWidget !== null}
                onClose={() => setConfiguringWidget(null)}
                onApply={handleConfigureApply}
                dataSources={dataSources}
            />
        </div>
    );
}
