export type WidgetType = 'stat' | 'chart' | 'table' | 'custom';

export type DashboardWidget = {
    id: string;
    title: string;
    description: string;
    icon: string;
    type: WidgetType;
    value: unknown;
    order: number;
};

export type WidgetLayout = {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
};

export type WidgetTemplate = {
    id: string;
    label: string;
    icon: string;
    type: WidgetType;
    defaultW: number;
    defaultH: number;
};
