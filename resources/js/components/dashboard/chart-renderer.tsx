import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    Cell,
    ComposedChart,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    XAxis,
    YAxis,
} from 'recharts';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegendContent,
    type ChartConfig,
} from '@/components/ui/chart';
import { formatDate } from '@/lib/format';
import type { ReactNode } from 'react';
import type { WidgetChart } from '@/types/dashboard';

type ChartRendererProps = {
    chart: WidgetChart;
    className?: string;
};

export function ChartRenderer({ chart, className }: ChartRendererProps) {
    const config: ChartConfig = Object.fromEntries(
        Object.entries(chart.config).map(([key, val]) => [key, { label: val.label, ...(val.color ? { color: val.color } : {}) }]),
    );

    // Recharts ValueType is string | number | readonly (string | number)[] — use broad type for formatter compatibility
    const tooltipFormatter = (value: unknown, name: unknown) => {
        const nameStr = String(name ?? '');
        const cfg = chart.config[nameStr];
        const formatted = typeof value === 'number' ? value.toLocaleString() : String(value ?? '');
        return [formatted, cfg?.label ?? nameStr];
    };

    const labelFormatter = (label: ReactNode) => {
        const str = String(label);
        if (chart.xAxisKey && str) {
            return formatDate(str, { month: 'short', day: 'numeric' });
        }
        return str;
    };

    const commonProps = {
        data: chart.data,
    };

    const xaxis = chart.xAxisKey ? (
        <XAxis
            dataKey={chart.xAxisKey}
            tickLine={false}
            axisLine={false}
            fontSize={11}
            tickFormatter={(v: string) => formatDate(v, { month: 'short', day: 'numeric' })}
        />
    ) : undefined;

    const yaxis = <YAxis tickLine={false} axisLine={false} fontSize={11} width={35} />;

    const tooltip = (
        <ChartTooltip
            content={
                <ChartTooltipContent
                    formatter={tooltipFormatter}
                    labelFormatter={labelFormatter}
                    indicator="dot"
                />
            }
        />
    );

    const legend = chart.dataKeys.length > 1 ? (
        <Legend content={<ChartLegendContent />} />
    ) : undefined;

    switch (chart.type) {
        case 'area':
            return (
                <ChartContainer config={config} className={className}>
                    <AreaChart {...commonProps} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        {xaxis}
                        {yaxis}
                        {tooltip}
                        {legend}
                        {chart.dataKeys.map((key) => (
                            <Area
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={`var(--color-${key})`}
                                fill={`var(--color-${key})`}
                                fillOpacity={0.15}
                                strokeWidth={2}
                                dot={false}
                            />
                        ))}
                    </AreaChart>
                </ChartContainer>
            );

        case 'bar':
            return (
                <ChartContainer config={config} className={className}>
                    <BarChart {...commonProps} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        {xaxis}
                        {yaxis}
                        {tooltip}
                        {legend}
                        {chart.dataKeys.map((key) => (
                            <Bar
                                key={key}
                                dataKey={key}
                                fill={`var(--color-${key})`}
                                radius={[4, 4, 0, 0]}
                                stackId={chart.stacked ? 'stack' : undefined}
                            />
                        ))}
                    </BarChart>
                </ChartContainer>
            );

        case 'line':
            return (
                <ChartContainer config={config} className={className}>
                    <LineChart {...commonProps} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        {xaxis}
                        {yaxis}
                        {tooltip}
                        {legend}
                        {chart.dataKeys.map((key) => (
                            <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={`var(--color-${key})`}
                                strokeWidth={2}
                                dot={{ r: 3, fill: `var(--color-${key})` }}
                                activeDot={{ r: 5 }}
                            />
                        ))}
                    </LineChart>
                </ChartContainer>
            );

        case 'pie':
            return (
                <ChartContainer config={config} className={className}>
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        {tooltip}
                        <Pie
                            data={chart.data}
                            dataKey={chart.dataKeys[0]}
                            nameKey={chart.xAxisKey}
                            cx="50%"
                            cy="50%"
                            innerRadius="40%"
                            outerRadius="80%"
                            paddingAngle={2}
                        >
                            {chart.data.map((_, i) => {
                                const keys = Object.keys(chart.config);
                                const colorKey = keys[i % keys.length];
                                return <Cell key={i} fill={`var(--color-${colorKey})`} />;
                            })}
                        </Pie>
                        {legend}
                    </PieChart>
                </ChartContainer>
            );

        case 'composed':
            return (
                <ChartContainer config={config} className={className}>
                    <ComposedChart {...commonProps} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        {xaxis}
                        {yaxis}
                        {tooltip}
                        {legend}
                        {chart.dataKeys.map((key, i) =>
                            i === 0 ? (
                                <Bar key={key} dataKey={key} fill={`var(--color-${key})`} radius={[4, 4, 0, 0]} />
                            ) : (
                                <Line key={key} type="monotone" dataKey={key} stroke={`var(--color-${key})`} strokeWidth={2} dot={false} />
                            ),
                        )}
                    </ComposedChart>
                </ChartContainer>
            );
    }
}
