import type { WidgetConfig, WidgetInstance, DisplayMode, WidgetData, WidgetMapProps } from '@/types/dashboard';
import { StatCard } from './stat-card';
import { ChartRenderer } from './chart-renderer';
import { WidgetTable } from './widget-table';
import { WidgetWrapper } from './widget-wrapper';

export function WidgetMap({ widget, config, data, onRemove, noDataLabel, onModeChange, onRename }: WidgetMapProps) {
    const title = config?.label ?? widget.identifier;
    const remove = () => onRemove(widget.id);
    const displayMode = widget.displayMode ?? 'stat';

    const availableModes: DisplayMode[] = [];
    if (data?.stat) availableModes.push('stat');
    if (data?.chart) availableModes.push('chart');
    if (data?.table) availableModes.push('table');
    if (availableModes.length === 0) availableModes.push('stat');

    const effectiveMode: DisplayMode = data?.[displayMode] ? displayMode : availableModes[0];

    const handleModeChange = (mode: DisplayMode) => {
        onModeChange?.(widget.id, mode);
    };

    const handleRename = () => {
        onRename?.(widget.id);
    };

    const hasData = data !== null && data[effectiveMode] !== undefined;

    const content = data
        ? effectiveMode === 'stat' && data.stat
            ? <StatCard stat={data.stat} />
            : effectiveMode === 'chart' && data.chart
                ? <ChartRenderer chart={data.chart} />
                : effectiveMode === 'table' && data.table
                    ? <WidgetTable table={data.table} />
                    : null
        : null;

    return (
        <div data-widget-id={widget.id} data-widget-card className="h-full">
            <WidgetWrapper
                title={title}
                onRemove={remove}
                hasData={hasData}
                noDataLabel={noDataLabel}
                displayMode={effectiveMode}
                onModeChange={onModeChange ? handleModeChange : undefined}
                onRename={onRename ? handleRename : undefined}
                availableModes={availableModes}
            >
                {content}
            </WidgetWrapper>
        </div>
    );
}
