import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/format';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type TableData = { columns: string[]; rows: Record<string, unknown>[] };

export default function WidgetTable({ value }: { value: unknown }) {
    const data = value as TableData | null;
    if (!data?.rows?.length) return null;

    const keys = Object.keys(data.rows[0]);

    return (
        <div className="overflow-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        {data.columns.map((col, i) => (
                            <TableHead key={i} className="h-8 px-2 py-1 text-[11px]">
                                {col}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.rows.map((row, i) => (
                        <TableRow key={i}>
                            {keys.map((key) => (
                                <TableCell key={key} className="px-2 py-1.5 text-xs">
                                    <CellContent columnKey={key} value={row[key]} />
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

function CellContent({ columnKey, value }: { columnKey: string; value: unknown }) {
    if (value === null || value === undefined) return <span className="text-muted-foreground">—</span>;

    if (columnKey === 'total' && typeof value === 'number') {
        return <span className="font-medium tabular-nums">{formatCurrency(value)}</span>;
    }

    if (columnKey === 'date' && typeof value === 'string') {
        return <span className="text-muted-foreground">{formatDate(value, { day: 'numeric', month: 'short', year: 'numeric' })}</span>;
    }

    if (columnKey === 'status' && typeof value === 'string') {
        return <StatusBadge status={value} />;
    }

    if (columnKey === 'number') {
        return <span className="font-medium">{String(value)}</span>;
    }

    return String(value);
}

const statusStyles: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    viewed: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
    paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    partial: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    overdue: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    cancelled: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    expired: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    converted: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
};

function StatusBadge({ status }: { status: string }) {
    return (
        <Badge variant="secondary" className={`text-[10px] ${statusStyles[status] ?? ''}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
    );
}
