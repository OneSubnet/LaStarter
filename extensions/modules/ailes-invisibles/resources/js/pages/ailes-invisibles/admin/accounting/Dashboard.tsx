import { Head } from '@inertiajs/react';
import {
    Calculator,
    Euro,
    FileText,
    TrendingUp,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { MonthlyRevenue, JournalEntry } from '@/types/ailes-invisibles';
import { formatCurrency } from '@/types/ailes-invisibles';

type Props = {
    totalRevenue: number;
    invoicesIssued: number;
    unpaidTotal: number;
    vatCollected: number;
    monthlyRevenues: MonthlyRevenue[];
    recentJournalEntries: JournalEntry[];
};

export default function Dashboard({
    totalRevenue = 0,
    invoicesIssued = 0,
    unpaidTotal = 0,
    vatCollected = 0,
    monthlyRevenues = [],
    recentJournalEntries = [],
}: Props) {
    const { t } = useTranslation();
    const fmt = formatCurrency;

    const kpiCards = [
        {
            title: t('ai.accounting.total_revenue'),
            value: fmt(totalRevenue),
            icon: Euro,
            color: 'text-green-600',
            bgColor: 'bg-green-50 dark:bg-green-950/30',
        },
        {
            title: t('ai.accounting.invoices_issued'),
            value: invoicesIssued.toString(),
            icon: FileText,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-950/30',
        },
        {
            title: t('ai.accounting.unpaid'),
            value: fmt(unpaidTotal),
            icon: Calculator,
            color: 'text-red-600',
            bgColor: 'bg-red-50 dark:bg-red-950/30',
        },
        {
            title: t('ai.accounting.tax_collected'),
            value: fmt(vatCollected),
            icon: TrendingUp,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50 dark:bg-purple-950/30',
        },
    ];

    return (
        <AppLayout breadcrumbs={[{ title: t('ai.accounting.breadcrumb') }]}>
            <Head title={t('ai.accounting.breadcrumb')} />

            <div className="space-y-6">

                {/* KPI Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {kpiCards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <Card key={card.title} className={card.bgColor}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                                    <Icon className={`h-4 w-4 ${card.color}`} />
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Monthly Revenue */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                {t('ai.accounting.monthly_chart')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('ai.accounting.month')}</TableHead>
                                        <TableHead className="text-right">{t('ai.accounting.revenue')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {monthlyRevenues.map((entry) => (
                                        <TableRow key={entry.month}>
                                            <TableCell className="font-medium">{entry.month}</TableCell>
                                            <TableCell className="text-right">
                                                <span className={entry.revenue > 0 ? 'text-green-600' : 'text-muted-foreground'}>
                                                    {fmt(entry.revenue)}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {monthlyRevenues.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center text-muted-foreground py-4">
                                                {t('ai.accounting.no_data')}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Recent Journal Entries */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Calculator className="h-4 w-4" />
                                {t('ai.accounting.recent_entries')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('ai.accounting.date')}</TableHead>
                                        <TableHead>{t('ai.accounting.description')}</TableHead>
                                        <TableHead className="text-right">{t('ai.accounting.debit')}</TableHead>
                                        <TableHead className="text-right">{t('ai.accounting.credit')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentJournalEntries.map((entry) => (
                                        <TableRow key={entry.id}>
                                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                                {new Date(entry.date).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm font-medium">{entry.description}</div>
                                                {entry.reference && (
                                                    <div className="text-xs text-muted-foreground">{entry.reference}</div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {entry.debit > 0 ? (
                                                    <span className="text-sm">{fmt(entry.debit)}</span>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {entry.credit > 0 ? (
                                                    <span className="text-sm">{fmt(entry.credit)}</span>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {recentJournalEntries.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                                                {t('ai.accounting.no_entries')}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
