import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    RadarChart,
    XAxis,
    YAxis,
} from 'recharts';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from '@/components/ui/chart';
import { formatCurrency } from '@/lib/format';

const CHART_COLORS = [
    'hsl(221, 83%, 53%)',
    'hsl(142, 71%, 45%)',
    'hsl(38, 92%, 50%)',
    'hsl(0, 84%, 60%)',
    'hsl(262, 83%, 58%)',
    'hsl(186, 75%, 42%)',
    'hsl(328, 85%, 58%)',
    'hsl(170, 60%, 40%)',
];

type ChartData = {
    chartType: 'line' | 'bar' | 'pie' | 'donut' | 'radar' | 'radial' | 'bar-label';
    data: Record<string, unknown>[];
    xKey?: string;
    yKey?: string;
    angleKey?: string;
    radialMax?: number;
    centerLabel?: string;
};

function LineChartWidget({ data, xKey = 'date', yKey = 'value' }: { data: Record<string, unknown>[]; xKey: string; yKey: string }) {
    const config: ChartConfig = {
        [yKey]: { label: 'Valeur', color: CHART_COLORS[0] },
    };

    return (
        <ChartContainer config={config} className="aspect-auto h-full w-full">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <defs>
                    <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={`var(--color-${yKey})`} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={`var(--color-${yKey})`} stopOpacity={0.02} />
                    </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                    dataKey={xKey}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={10}
                    tickFormatter={(v: string) => {
                        if (v.includes('-')) {
                            const d = new Date(v);
                            return `${d.getDate()}/${d.getMonth() + 1}`;
                        }
                        return v;
                    }}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={4} fontSize={10} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Area
                    type="monotone"
                    dataKey={yKey}
                    stroke={`var(--color-${yKey})`}
                    fill="url(#fillGradient)"
                    strokeWidth={2}
                    dot={false}
                />
            </AreaChart>
        </ChartContainer>
    );
}

function BarChartWidget({ data, xKey = 'name', yKey = 'value' }: { data: Record<string, unknown>[]; xKey: string; yKey: string }) {
    const config = Object.fromEntries(
        data.map((item, i) => [
            String(item[xKey] ?? `item-${i}`),
            { label: String(item[xKey] ?? `Item ${i}`), color: CHART_COLORS[i % CHART_COLORS.length] },
        ]),
    );

    return (
        <ChartContainer config={config} className="aspect-auto h-full w-full">
            <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={8} fontSize={10} />
                <YAxis tickLine={false} axisLine={false} tickMargin={4} fontSize={10} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey={yKey} radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {data.map((item, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                </Bar>
            </BarChart>
        </ChartContainer>
    );
}

function PieChartWidget({ data }: { data: Record<string, unknown>[] }) {
    const config = Object.fromEntries(
        data.map((item, i) => [
            String(item.name ?? `item-${i}`),
            { label: String(item.name ?? `Item ${i}`), color: CHART_COLORS[i % CHART_COLORS.length] },
        ]),
    );

    return (
        <ChartContainer config={config} className="aspect-auto h-full w-full">
            <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="30%"
                    outerRadius="60%"
                    paddingAngle={2}
                    strokeWidth={1}
                >
                    {data.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
            </PieChart>
        </ChartContainer>
    );
}

function DonutChartWidget({ data, centerLabel }: { data: Record<string, unknown>[]; centerLabel?: string }) {
    const config = Object.fromEntries(
        data.map((item, i) => [
            String(item.name ?? `item-${i}`),
            { label: String(item.name ?? `Item ${i}`), color: CHART_COLORS[i % CHART_COLORS.length] },
        ]),
    );

    const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

    return (
        <ChartContainer config={config} className="aspect-auto h-full w-full">
            <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="55%"
                    outerRadius="75%"
                    paddingAngle={2}
                    strokeWidth={2}
                    cornerRadius={4}
                >
                    {data.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                {centerLabel && (
                    <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-foreground text-xl font-bold"
                    >
                        {centerLabel}
                    </text>
                )}
                {!centerLabel && (
                    <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-foreground text-xl font-bold"
                    >
                        {formatCurrency(total)}
                    </text>
                )}
            </PieChart>
        </ChartContainer>
    );
}

function RadarChartWidget({ data, angleKey = 'subject', yKey = 'value' }: { data: Record<string, unknown>[]; angleKey: string; yKey: string }) {
    const config: ChartConfig = {
        [yKey]: { label: 'Valeur', color: CHART_COLORS[0] },
    };

    return (
        <ChartContainer config={config} className="aspect-auto h-full w-full">
            <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
                <ChartTooltip content={<ChartTooltipContent />} />
                <PolarGrid />
                <PolarAngleAxis dataKey={angleKey} fontSize={10} className="fill-muted-foreground" />
                <PolarRadiusAxis fontSize={9} className="fill-muted-foreground" />
                <Radar
                    name={yKey}
                    dataKey={yKey}
                    stroke={`var(--color-${yKey})`}
                    fill={`var(--color-${yKey})`}
                    fillOpacity={0.25}
                    strokeWidth={2}
                />
            </RadarChart>
        </ChartContainer>
    );
}

function RadialChartWidget({ data, radialMax = 100, centerLabel }: { data: Record<string, unknown>[]; radialMax?: number; centerLabel?: string }) {
    const value = Number(data[0]?.value ?? 0);
    const remaining = Math.max(0, radialMax - value);
    const percentage = Math.min(100, Math.round((value / radialMax) * 100));

    const chartData = [
        { name: 'value', value },
        { name: 'remaining', value: remaining },
    ];

    const config: ChartConfig = {
        value: { label: centerLabel ?? 'Progress', color: CHART_COLORS[0] },
        remaining: { label: 'Remaining', color: 'hsl(var(--muted))' },
    };

    return (
        <ChartContainer config={config} className="aspect-auto h-full w-full">
            <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="60%"
                    outerRadius="80%"
                    startAngle={90}
                    endAngle={-270}
                    strokeWidth={0}
                    cornerRadius={6}
                >
                    <Cell fill={CHART_COLORS[0]} />
                    <Cell fill="hsl(var(--muted))" />
                </Pie>
                <text
                    x="50%"
                    y="45%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground text-2xl font-bold"
                >
                    {percentage}%
                </text>
                <text
                    x="50%"
                    y="58%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-muted-foreground text-xs"
                >
                    {centerLabel ?? `${value} / ${radialMax}`}
                </text>
            </PieChart>
        </ChartContainer>
    );
}

function BarLabelChartWidget({ data, xKey = 'name', yKey = 'value' }: { data: Record<string, unknown>[]; xKey: string; yKey: string }) {
    const config = Object.fromEntries(
        data.map((item, i) => [
            String(item[xKey] ?? `item-${i}`),
            { label: String(item[xKey] ?? `Item ${i}`), color: CHART_COLORS[i % CHART_COLORS.length] },
        ]),
    );

    return (
        <ChartContainer config={config} className="aspect-auto h-full w-full">
            <BarChart data={data} margin={{ top: 16, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={8} fontSize={10} />
                <YAxis tickLine={false} axisLine={false} tickMargin={4} fontSize={10} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar
                    dataKey={yKey}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                    label={{ position: 'top', fontSize: 10, className: 'fill-foreground' }}
                >
                    {data.map((item, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                </Bar>
            </BarChart>
        </ChartContainer>
    );
}

export default function WidgetChart({ value }: { value: unknown }) {
    const chartData = value as ChartData | null;
    if (!chartData?.data?.length) return null;

    switch (chartData.chartType) {
        case 'line':
            return <LineChartWidget data={chartData.data} xKey={chartData.xKey ?? 'date'} yKey={chartData.yKey ?? 'value'} />;
        case 'bar':
            return <BarChartWidget data={chartData.data} xKey={chartData.xKey ?? 'name'} yKey={chartData.yKey ?? 'value'} />;
        case 'pie':
            return <PieChartWidget data={chartData.data} />;
        case 'donut':
            return <DonutChartWidget data={chartData.data} centerLabel={chartData.centerLabel} />;
        case 'radar':
            return <RadarChartWidget data={chartData.data} angleKey={chartData.angleKey ?? 'subject'} yKey={chartData.yKey ?? 'value'} />;
        case 'radial':
            return <RadialChartWidget data={chartData.data} radialMax={chartData.radialMax ?? 100} centerLabel={chartData.centerLabel} />;
        case 'bar-label':
            return <BarLabelChartWidget data={chartData.data} xKey={chartData.xKey ?? 'name'} yKey={chartData.yKey ?? 'value'} />;
        default:
            return null;
    }
}
