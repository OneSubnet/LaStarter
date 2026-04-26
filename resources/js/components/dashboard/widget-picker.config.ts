import {
    Activity,
    BarChart3,
    BarChartHorizontal,
    CircleDot,
    FileText,
    Grid3x3,
    List,
    PieChart,
    Radar,
    Target,
    TrendingUp,
    Users,
    type LucideIcon,
} from 'lucide-react';
import type { WidgetTemplate } from '@/types/dashboard';

export const WIDGET_ICON_MAP: Record<string, LucideIcon> = {
    Users,
    Activity,
    TrendingUp,
    BarChart3,
    BarChartHorizontal,
    PieChart,
    CircleDot,
    Radar,
    Target,
    List,
    FileText,
    Grid3x3,
};

export const WIDGET_TEMPLATES: WidgetTemplate[] = [
    { id: 'stat-revenue', label: 'dashboard.widgets.revenue', icon: 'TrendingUp', type: 'stat', defaultW: 3, defaultH: 2 },
    { id: 'stat-members', label: 'dashboard.widgets.members', icon: 'Users', type: 'stat', defaultW: 3, defaultH: 2 },
    { id: 'stat-activity', label: 'dashboard.widgets.activity', icon: 'Activity', type: 'stat', defaultW: 3, defaultH: 2 },
    { id: 'chart-line', label: 'dashboard.widgets.line_chart', icon: 'TrendingUp', type: 'chart', defaultW: 6, defaultH: 4 },
    { id: 'chart-bar', label: 'dashboard.widgets.bar_chart', icon: 'BarChart3', type: 'chart', defaultW: 6, defaultH: 4 },
    { id: 'chart-pie', label: 'dashboard.widgets.pie_chart', icon: 'PieChart', type: 'chart', defaultW: 4, defaultH: 4 },
    { id: 'chart-donut', label: 'dashboard.widgets.donut_chart', icon: 'CircleDot', type: 'chart', defaultW: 4, defaultH: 4 },
    { id: 'chart-radar', label: 'dashboard.widgets.radar_chart', icon: 'Radar', type: 'chart', defaultW: 5, defaultH: 4 },
    { id: 'chart-radial', label: 'dashboard.widgets.radial_chart', icon: 'Target', type: 'chart', defaultW: 3, defaultH: 4 },
    { id: 'chart-bar-label', label: 'dashboard.widgets.bar_label_chart', icon: 'BarChartHorizontal', type: 'chart', defaultW: 6, defaultH: 4 },
    { id: 'table-recent', label: 'dashboard.widgets.recent_table', icon: 'List', type: 'table', defaultW: 6, defaultH: 4 },
];
