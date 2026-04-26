import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import {
    Calendar,
    FileText,
    MessageCircle,
    Package,
    Receipt,
    TrendingDown,
    TrendingUp,
    Users,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis,
} from 'recharts';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type MonthlyDataPoint = { month: string; revenue: number };

type Props = {
    clientsCount: number;
    productsCount: number;
    eventsCount: number;
    quotesCount: number;
    invoicesCount: number;
    documentsCount: number;
    unpaidTotal: number;
    monthlyRevenue: number;
    revenueTrend: number;
    monthlyData: MonthlyDataPoint[];
    clientTypes: { pro: number; individual: number };
    invoiceStatuses: Record<string, number>;
};

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

const formatCurrency = (value: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' }).format(value);

export default function Dashboard(props: Props) {
    const { t } = useTranslation();

    const statCards = [
        { key: 'clientsCount' as const, title: t('ai.dashboard.clients'), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
        { key: 'productsCount' as const, title: t('ai.dashboard.products'), icon: Package, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
        { key: 'eventsCount' as const, title: t('ai.dashboard.events'), icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30' },
        { key: 'quotesCount' as const, title: t('ai.dashboard.quotes'), icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
        { key: 'invoicesCount' as const, title: t('ai.dashboard.invoices'), icon: Receipt, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
        { key: 'documentsCount' as const, title: t('ai.dashboard.documents'), icon: MessageCircle, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-950/30' },
    ];

    const clientTypeData = [
        { name: t('ai.dashboard.professionals'), value: props.clientTypes.pro },
        { name: t('ai.dashboard.individuals'), value: props.clientTypes.individual },
    ].filter((d) => d.value > 0);

    const invoiceStatusData = [
        { name: t('ai.dashboard.paid'), value: props.invoiceStatuses.paid ?? 0, color: '#10b981' },
        { name: t('ai.dashboard.sent'), value: props.invoiceStatuses.sent ?? 0, color: '#3b82f6' },
        { name: t('ai.dashboard.overdue'), value: props.invoiceStatuses.overdue ?? 0, color: '#ef4444' },
        { name: t('ai.dashboard.draft'), value: props.invoiceStatuses.draft ?? 0, color: '#6b7280' },
        { name: t('ai.dashboard.cancelled'), value: props.invoiceStatuses.cancelled ?? 0, color: '#9ca3af' },
    ].filter((d) => d.value > 0);

    return (
        <AppLayout breadcrumbs={[{ title: t('ai.dashboard.title') }]}>
            <Head title={t('ai.dashboard.title')} />

            <div className="space-y-6">
                {/* Stat cards */}
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                    {statCards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <Card key={card.key} className={card.bg}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                                    <Icon className={`h-4 w-4 ${card.color}`} />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{props[card.key]}</div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Revenue cards */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="bg-green-50 dark:bg-green-950/30">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('ai.dashboard.monthly_revenue')}</CardTitle>
                            {props.revenueTrend >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(props.monthlyRevenue ?? 0)}
                            </div>
                            {props.revenueTrend !== 0 && (
                                <p className={`text-xs ${props.revenueTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {props.revenueTrend >= 0 ? '+' : ''}{props.revenueTrend}% {t('ai.dashboard.vs_previous')}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="bg-red-50 dark:bg-red-950/30">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('ai.dashboard.unpaid')}</CardTitle>
                            <TrendingDown className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {formatCurrency(props.unpaidTotal ?? 0)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Revenue trend */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">{t('ai.dashboard.monthly_chart')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={props.monthlyData ?? []}>
                                    <defs>
                                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
                                    <YAxis className="text-xs" tick={{ fontSize: 12 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                                    <RechartsTooltip
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        formatter={(value: any) => [formatCurrency(Number(value)), t('ai.dashboard.monthly_revenue')]}
                                        contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#10b981"
                                        fill="url(#revenueGradient)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Client types pie */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">{t('ai.dashboard.client_types')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {clientTypeData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={clientTypeData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={4}
                                            dataKey="value"
                                            label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                        >
                                            {clientTypeData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                                    {t('ai.dashboard.no_clients')}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Invoice status bar chart */}
                {invoiceStatusData.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">{t('ai.dashboard.invoice_statuses')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={invoiceStatusData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 12 }} />
                                    <YAxis className="text-xs" tick={{ fontSize: 12 }} allowDecimals={false} />
                                    <RechartsTooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                        {invoiceStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
