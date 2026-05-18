import { router } from '@inertiajs/react';
import { formatDate, formatCurrency, timeAgo } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { WidgetTable as WidgetTableData, WidgetTableColumn } from '@/types/dashboard';

type WidgetTableProps = {
    table: WidgetTableData;
    className?: string;
};

const PAGE_SIZE = 5;

export function WidgetTable({ table, className }: WidgetTableProps) {
    const { t } = useTranslation();
    const [page, setPage] = useState(0);
    const totalPages = Math.ceil(table.rows.length / PAGE_SIZE);
    const rows = table.rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    return (
        <div className={className}>
            <div className="overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {table.columns.map((col) => (
                                <TableHead key={col.key} className="h-7 px-2 text-xs">
                                    {col.label}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row, i) => (
                            <TableRow
                                key={String(row.id ?? i)}
                                className={`px-2 py-1 text-xs ${table.clickable ? 'cursor-pointer hover:bg-accent/50' : ''}`}
                                onClick={() => handleRowClick(table, row)}
                            >
                                {table.columns.map((col) => (
                                    <TableCell key={col.key} className="px-2 py-1 text-xs">
                                        <ColumnValue column={col} value={row[col.key]} />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground">
                    <span>{page + 1}/{totalPages}</span>
                    <div className="flex gap-1">
                        <button
                            type="button"
                            className="hover:text-foreground disabled:opacity-30"
                            disabled={page === 0}
                            onClick={() => setPage(page - 1)}
                        >
                            {t('common.previous')}
                        </button>
                        <button
                            type="button"
                            className="hover:text-foreground disabled:opacity-30"
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage(page + 1)}
                        >
                            {t('common.next')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ColumnValue({ column, value }: { column: WidgetTableColumn; value: unknown }) {
    if (value === null || value === undefined) return <span className="text-muted-foreground">—</span>;

    switch (column.type) {
        case 'date': {
            const str = String(value);
            const date = new Date(str);
            const isRecent = Date.now() - date.getTime() < 86_400_000 * 7;
            return <span>{isRecent ? timeAgo(str) : formatDate(str)}</span>;
        }
        case 'currency':
            return <span>{formatCurrency(Number(value))}</span>;
        case 'number':
            return <span className="tabular-nums">{Number(value).toLocaleString()}</span>;
        case 'status':
            return <Badge variant="secondary" className="text-[10px]">{String(value)}</Badge>;
        default:
            return <span className="truncate">{String(value)}</span>;
    }
}

function handleRowClick(table: WidgetTableData, row: Record<string, unknown>) {
    if (!table.clickable) return;
    const { route: routePattern, key } = table.clickable;
    const keyValue = String(row[key] ?? '');
    router.visit(`${routePattern}/${keyValue}`);
}
