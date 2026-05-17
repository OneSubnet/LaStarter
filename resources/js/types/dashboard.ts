import type { ReactNode } from 'react';

// ── Layout ──────────────────────────────────────────────

export type GridLayout = {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
};

export type WidgetInstance = {
    id: string;
    identifier: string;
    displayMode?: DisplayMode;
    config?: Record<string, unknown>;
};

export type WidgetConfig = {
    identifier: string;
    label: string;
    type: string;
    size: { w: number; h: number };
    permission: string | null;
};

export type DashboardLayoutData = {
    id: number;
    layout: GridLayout[];
    widgets: WidgetInstance[];
    widgetData: Record<string, WidgetData | null>;
    isDefault: boolean;
};

// ── Display Modes ───────────────────────────────────────

export type DisplayMode = 'stat' | 'chart' | 'table';

export type DateRange = {
    from: string;
    to: string;
};

export type DatePreset = '7d' | '30d' | '90d' | '1y' | 'custom';

// ── Stat Card ───────────────────────────────────────────

export type TrendData = {
    value: number;
    direction: 'up' | 'down' | 'flat';
    label?: string;
};

export type SparklineData = {
    points: number[];
    color?: string;
};

export type WidgetStat = {
    value: string | number;
    label?: string;
    icon?: string;
    trend?: TrendData;
    sparkline?: SparklineData;
    formatted?: string;
};

// ── Chart ───────────────────────────────────────────────

export type ChartType = 'area' | 'bar' | 'line' | 'pie' | 'composed';

export type WidgetChart = {
    type: ChartType;
    data: Record<string, unknown>[];
    config: Record<string, { label: string; color?: string }>;
    xAxisKey?: string;
    dataKeys: string[];
    stacked?: boolean;
};

// ── Table ───────────────────────────────────────────────

export type TableColumnType = 'text' | 'date' | 'currency' | 'number' | 'status';

export type WidgetTableColumn = {
    key: string;
    label: string;
    type?: TableColumnType;
};

export type WidgetTableClick = {
    route: string;
    key: string;
};

export type WidgetTable = {
    columns: WidgetTableColumn[];
    rows: Record<string, unknown>[];
    clickable?: WidgetTableClick;
};

// ── Aggregate Widget Data ───────────────────────────────

export type WidgetData = {
    stat?: WidgetStat;
    chart?: WidgetChart;
    table?: WidgetTable;
};

// ── Component Props ─────────────────────────────────────

export type WidgetWrapperProps = {
    title: string;
    onRemove: () => void;
    children: ReactNode;
    className?: string;
    hasData: boolean;
    noDataLabel: string;
    displayMode?: DisplayMode;
    onModeChange?: (mode: DisplayMode) => void;
    availableModes?: DisplayMode[];
    onRename?: () => void;
};

export type ListWidgetProps = {
    title: string;
    onRemove: () => void;
    data: Record<string, unknown> | null;
    noDataLabel: string;
    renderItem?: (item: Record<string, unknown>) => ReactNode;
};

export type WidgetPickerProps = {
    availableWidgets: WidgetConfig[];
    activeWidgetIds: string[];
    onAdd: (widget: WidgetInstance) => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
};

export type WidgetMapProps = {
    widget: WidgetInstance;
    config: WidgetConfig | undefined;
    data: WidgetData | null;
    onRemove: (id: string) => void;
    noDataLabel: string;
    onModeChange?: (id: string, mode: DisplayMode) => void;
    onRename?: (id: string) => void;
};
