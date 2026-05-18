import type { CombinedWidgetConfig, CombinedWidgetData, WidgetConfig, WidgetInstance, DisplayMode, WidgetMapProps } from '@/types/dashboard';
import { StatCard } from './stat-card';
import { ChartRenderer } from './chart-renderer';
import { WidgetTable } from './widget-table';
import { WidgetWrapper } from './widget-wrapper';

function isCombinedData(data: unknown): data is CombinedWidgetData {
    return typeof data === 'object' && data !== null && 'warnings' in data && 'sources' in data;
}

export function WidgetMap({ widget, config, data, onRemove, noDataLabel, onModeChange, onRename, onCombine, chartSources }: WidgetMapProps) {
    const isCombined = widget.identifier === 'combined';
    const combinedConfig = isCombined ? (widget.config as CombinedWidgetConfig | undefined) : undefined;
    const title = isCombined
        ? (combinedConfig?.label ?? chartSources?.filter((s) => combinedConfig?.sources?.includes(s.identifier)).map((s) => s.label).join(' + ') ?? 'Combined')
        : (config?.label ?? widget.identifier);
    const remove = () => onRemove(widget.id);
    const displayMode = widget.displayMode ?? 'stat';

    const availableModes: DisplayMode[] = [];
    if (data?.stat) availableModes.push('stat');
    if (data?.chart) availableModes.push('chart');
    if (data?.table) availableModes.push('table');
    if (availableModes.length === 0) availableModes.push('stat');

    const effectiveMode: DisplayMode = isCombined ? 'chart' : (data?.[displayMode] ? displayMode : availableModes[0]);

    const handleModeChange = (mode: DisplayMode) => {
        onModeChange?.(widget.id, mode);
    };

    const handleRename = () => {
        onRename?.(widget.id);
    };

    const handleCombine = () => {
        onCombine?.(widget.id);
    };

    const hasData = isCombined
        ? data?.chart !== undefined
        : data !== null && data[effectiveMode] !== undefined;

    const warnings = isCombinedData(data) ? data.warnings : [];

    const content = isCombined
        ? data?.chart ? <ChartRenderer chart={data.chart} /> : null
        : data
            ? effectiveMode === 'stat' && data.stat
                ? <StatCard stat={data.stat} />
                : effectiveMode === 'chart' && data.chart
                    ? <ChartRenderer chart={data.chart} />
                    : effectiveMode === 'table' && data.table
                        ? <WidgetTable table={data.table} />
                        : null
            : null;

    const showCombine = !isCombined && data?.chart !== undefined;

    return (
        <div data-widget-id={widget.id} data-widget-card className="h-full">
            <WidgetWrapper
                title={title}
                onRemove={remove}
                hasData={hasData}
                noDataLabel={noDataLabel}
                displayMode={effectiveMode}
                onModeChange={!isCombined && onModeChange ? handleModeChange : undefined}
                onRename={onRename ? handleRename : undefined}
                onCombine={showCombine || isCombined ? handleCombine : undefined}
                isCombined={isCombined}
                warnings={warnings}
                availableModes={isCombined ? ['chart'] : availableModes}
            >
                {content}
            </WidgetWrapper>
        </div>
    );
}
