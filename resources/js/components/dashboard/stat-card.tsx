import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { iconMap } from '@/lib/icon-map';
import type { WidgetStat, SparklineData, TrendData } from '@/types/dashboard';

type StatCardProps = {
    stat: WidgetStat;
    className?: string;
};

export function StatCard({ stat, className }: StatCardProps) {
    const Icon = stat.icon ? iconMap[stat.icon] : undefined;

    return (
        <div className={cn('flex flex-col gap-1 p-1', className)}>
            <div className="flex items-start justify-between">
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight">
                        {stat.formatted ?? String(stat.value)}
                    </span>
                    {stat.trend && <TrendIndicator trend={stat.trend} />}
                </div>
                {Icon && (
                    <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
                        <Icon className="h-4 w-4" />
                    </div>
                )}
            </div>
            {stat.label && (
                <span className="text-muted-foreground text-xs">{stat.label}</span>
            )}
            {stat.sparkline && <Sparkline data={stat.sparkline} />}
        </div>
    );
}

function TrendIndicator({ trend }: { trend: TrendData }) {
    const colors = {
        up: 'text-emerald-600',
        down: 'text-red-500',
        flat: 'text-muted-foreground',
    };
    const icons = {
        up: ArrowUp,
        down: ArrowDown,
        flat: Minus,
    };
    const TrendIcon = icons[trend.direction];

    return (
        <span className={cn('flex items-center gap-0.5 text-xs font-medium', colors[trend.direction])}>
            <TrendIcon className="h-3 w-3" />
            {trend.value > 0 && `${trend.value > 0 ? '+' : ''}${trend.value}%`}
            {trend.label && (
                <span className="text-muted-foreground font-normal">{trend.label}</span>
            )}
        </span>
    );
}

function Sparkline({ data }: { data: SparklineData }) {
    if (data.points.length < 2) return null;

    const chartData = data.points.map((v, i) => ({ x: i, y: v }));
    const color = data.color ?? 'hsl(var(--primary))';

    return (
        <div className="h-6 w-16">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                        <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area
                        type="monotone"
                        dataKey="y"
                        stroke={color}
                        strokeWidth={1.5}
                        fill="url(#sparkGradient)"
                        dot={false}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
