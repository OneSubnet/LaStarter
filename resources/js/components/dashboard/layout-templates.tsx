import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import type { DashboardWidget, WidgetLayout } from '@/types/dashboard';

type Template = {
    id: string;
    labelKey: string;
    descKey: string;
    widgets: Omit<DashboardWidget, 'order' | 'value'>[];
    layouts: WidgetLayout[];
};

const templates: Template[] = [
    {
        id: 'overview',
        labelKey: 'dashboard.templates.overview',
        descKey: 'dashboard.templates.overview_desc',
        widgets: [
            { id: 'ai-clients', title: 'Clients', description: '', icon: 'Users', type: 'stat' },
            { id: 'ai-revenue', title: 'Revenue', description: '', icon: 'TrendingUp', type: 'stat' },
            { id: 'ai-invoices', title: 'Invoices', description: '', icon: 'Receipt', type: 'stat' },
            { id: 'ai-events', title: 'Events', description: '', icon: 'Calendar', type: 'stat' },
            { id: 'ai-revenue-chart', title: 'Revenue Over Time', description: '', icon: 'TrendingUp', type: 'chart' },
            { id: 'ai-invoice-status', title: 'Invoice Status', description: '', icon: 'PieChart', type: 'chart' },
        ],
        layouts: [
            { i: 'ai-clients', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
            { i: 'ai-revenue', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
            { i: 'ai-invoices', x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
            { i: 'ai-events', x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
            { i: 'ai-revenue-chart', x: 0, y: 2, w: 8, h: 4, minW: 4, minH: 3 },
            { i: 'ai-invoice-status', x: 8, y: 2, w: 4, h: 4, minW: 3, minH: 3 },
        ],
    },
    {
        id: 'finance',
        labelKey: 'dashboard.templates.finance',
        descKey: 'dashboard.templates.finance_desc',
        widgets: [
            { id: 'ai-revenue', title: 'Revenue', description: '', icon: 'TrendingUp', type: 'stat' },
            { id: 'ai-invoices', title: 'Invoices', description: '', icon: 'Receipt', type: 'stat' },
            { id: 'ai-revenue-chart', title: 'Revenue Over Time', description: '', icon: 'TrendingUp', type: 'chart' },
            { id: 'ai-invoice-status', title: 'Invoice Status', description: '', icon: 'PieChart', type: 'chart' },
            { id: 'ai-recent-invoices', title: 'Recent Invoices', description: '', icon: 'List', type: 'table' },
        ],
        layouts: [
            { i: 'ai-revenue', x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
            { i: 'ai-invoices', x: 4, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
            { i: 'ai-revenue-chart', x: 0, y: 2, w: 8, h: 4, minW: 4, minH: 3 },
            { i: 'ai-invoice-status', x: 8, y: 2, w: 4, h: 4, minW: 3, minH: 3 },
            { i: 'ai-recent-invoices', x: 0, y: 6, w: 12, h: 4, minW: 6, minH: 3 },
        ],
    },
    {
        id: 'crm',
        labelKey: 'dashboard.templates.crm',
        descKey: 'dashboard.templates.crm_desc',
        widgets: [
            { id: 'ai-clients', title: 'Clients', description: '', icon: 'Users', type: 'stat' },
            { id: 'team_members', title: 'Members', description: '', icon: 'Users', type: 'stat' },
            { id: 'ai-events', title: 'Events', description: '', icon: 'Calendar', type: 'stat' },
            { id: 'ai-recent-invoices', title: 'Recent Invoices', description: '', icon: 'List', type: 'table' },
        ],
        layouts: [
            { i: 'ai-clients', x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
            { i: 'team_members', x: 4, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
            { i: 'ai-events', x: 8, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
            { i: 'ai-recent-invoices', x: 0, y: 2, w: 12, h: 5, minW: 6, minH: 3 },
        ],
    },
    {
        id: 'analytics',
        labelKey: 'dashboard.templates.analytics',
        descKey: 'dashboard.templates.analytics_desc',
        widgets: [
            { id: 'ai-clients', title: 'Clients', description: '', icon: 'Users', type: 'stat' },
            { id: 'ai-revenue', title: 'Revenue', description: '', icon: 'TrendingUp', type: 'stat' },
            { id: 'ai-revenue-donut', title: 'Revenue by Source', description: '', icon: 'CircleDot', type: 'chart' },
            { id: 'ai-performance-radar', title: 'Performance', description: '', icon: 'Radar', type: 'chart' },
            { id: 'ai-revenue-trend', title: 'Revenue Trend', description: '', icon: 'TrendingUp', type: 'chart' },
        ],
        layouts: [
            { i: 'ai-clients', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
            { i: 'ai-revenue', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
            { i: 'ai-revenue-donut', x: 6, y: 0, w: 3, h: 4, minW: 3, minH: 3 },
            { i: 'ai-performance-radar', x: 9, y: 0, w: 3, h: 4, minW: 3, minH: 3 },
            { i: 'ai-revenue-trend', x: 0, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
        ],
    },
    {
        id: 'sales',
        labelKey: 'dashboard.templates.sales',
        descKey: 'dashboard.templates.sales_desc',
        widgets: [
            { id: 'ai-revenue', title: 'Revenue', description: '', icon: 'TrendingUp', type: 'stat' },
            { id: 'ai-invoices', title: 'Invoices', description: '', icon: 'Receipt', type: 'stat' },
            { id: 'ai-conversion', title: 'Conversion', description: '', icon: 'TrendingUp', type: 'stat' },
            { id: 'ai-monthly-sales', title: 'Monthly Sales', description: '', icon: 'BarChart3', type: 'chart' },
            { id: 'ai-target-progress', title: 'Target Progress', description: '', icon: 'Target', type: 'chart' },
        ],
        layouts: [
            { i: 'ai-revenue', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
            { i: 'ai-invoices', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
            { i: 'ai-conversion', x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
            { i: 'ai-target-progress', x: 9, y: 0, w: 3, h: 4, minW: 2, minH: 3 },
            { i: 'ai-monthly-sales', x: 0, y: 2, w: 9, h: 4, minW: 4, minH: 3 },
        ],
    },
    {
        id: 'performance',
        labelKey: 'dashboard.templates.performance',
        descKey: 'dashboard.templates.performance_desc',
        widgets: [
            { id: 'ai-kpi-gauge', title: 'KPI Score', description: '', icon: 'Target', type: 'chart' },
            { id: 'ai-metrics-radar', title: 'Metrics Overview', description: '', icon: 'Radar', type: 'chart' },
            { id: 'ai-trend-line', title: 'Trend', description: '', icon: 'TrendingUp', type: 'chart' },
        ],
        layouts: [
            { i: 'ai-kpi-gauge', x: 0, y: 0, w: 4, h: 4, minW: 2, minH: 3 },
            { i: 'ai-metrics-radar', x: 4, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
            { i: 'ai-trend-line', x: 8, y: 0, w: 4, h: 4, minW: 4, minH: 3 },
        ],
    },
    {
        id: 'blank',
        labelKey: 'dashboard.templates.blank',
        descKey: 'dashboard.templates.blank_desc',
        widgets: [],
        layouts: [],
    },
];

export default function LayoutTemplates({
    onSelect,
}: {
    onSelect: (widgets: DashboardWidget[], layouts: WidgetLayout[]) => void;
}) {
    const { t } = useTranslation();

    return (
        <div className="grid grid-cols-2 gap-3">
            {templates.map((tmpl) => (
                <Button
                    key={tmpl.id}
                    variant="outline"
                    className={`flex h-auto flex-col items-start gap-1 p-4 text-left ${tmpl.id === 'blank' ? 'col-span-2' : ''}`}
                    onClick={() => onSelect(
                        tmpl.widgets.map((w) => ({ ...w, value: null, order: 0 })),
                        tmpl.layouts,
                    )}
                >
                    <span className="text-sm font-medium">{t(tmpl.labelKey)}</span>
                    <span className="text-xs text-muted-foreground">{t(tmpl.descKey)}</span>
                    {tmpl.widgets.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                            {tmpl.widgets.slice(0, 4).map((w) => (
                                <span key={w.id} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                    {w.title}
                                </span>
                            ))}
                            {tmpl.widgets.length > 4 && (
                                <span className="text-[10px] text-muted-foreground">+{tmpl.widgets.length - 4}</span>
                            )}
                        </div>
                    )}
                </Button>
            ))}
        </div>
    );
}
