export type WidgetType = 'stat' | 'chart' | 'table';

export interface DashboardWidget {
    id: string;
    title: string;
    description: string;
    icon: string;
    type: WidgetType;
    value: unknown;
    group?: string;
    order: number;
}

export interface WidgetLayout {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
}

export interface WidgetTemplate {
    id: string;
    label: string;
    icon: string;
    type: WidgetType;
    defaultW: number;
    defaultH: number;
}
