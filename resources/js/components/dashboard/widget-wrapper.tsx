import { cn } from '@/lib/utils';
import { AlertTriangle, BarChart3, GripVertical, Layers, LineChart, Pencil, Table, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DisplayMode, WidgetWrapperProps } from '@/types/dashboard';

const MODE_ICONS: Record<DisplayMode, React.ElementType> = {
    stat: BarChart3,
    chart: LineChart,
    table: Table,
};

export function WidgetWrapper({
    title,
    onRemove,
    children,
    className,
    hasData,
    noDataLabel,
    displayMode = 'stat',
    onModeChange,
    availableModes,
    onRename,
    onCombine,
    isCombined = false,
    warnings = [],
}: WidgetWrapperProps) {
    const { t } = useTranslation();
    const [menuOpen, setMenuOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuOpen(true);
    }, []);

    const closeMenu = useCallback(() => setMenuOpen(false), []);

    useEffect(() => {
        if (!menuOpen) return;
        const handleClick = () => closeMenu();
        document.addEventListener('click', handleClick, { once: true });
        return () => document.removeEventListener('click', handleClick);
    }, [menuOpen, closeMenu]);

    const modes = availableModes ?? ['stat', 'chart', 'table'];

    return (
        <div
            ref={containerRef}
            className={cn('relative flex h-full flex-col rounded border bg-card', className)}
            onContextMenu={handleContextMenu}
        >
            <div className="drag-handle flex cursor-grab items-center justify-between border-b px-3 py-2 active:cursor-grabbing">
                <div className="flex items-center gap-2">
                    <GripVertical className="text-muted-foreground h-3.5 w-3.5" />
                    <span className="text-sm font-medium leading-none">{title}</span>
                    {isCombined && (
                        <Layers className="text-primary h-3 w-3" />
                    )}
                    {warnings.length > 0 && (
                        <span className="flex items-center gap-0.5 text-amber-500" title={t('dashboard.unavailable_sources', `${warnings.length} unavailable`)}>
                            <AlertTriangle className="h-3 w-3" />
                            <span className="text-[10px]">{warnings.length}</span>
                        </span>
                    )}
                </div>
                {onModeChange && modes.length > 1 && !isCombined && (
                    <div className="mode-toggle flex items-center gap-0.5">
                        {modes.map((mode) => {
                            const Icon = MODE_ICONS[mode];
                            return (
                                <button
                                    key={mode}
                                    type="button"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => { e.stopPropagation(); onModeChange(mode); }}
                                    className={cn(
                                        'rounded p-1 transition-colors',
                                        displayMode === mode
                                            ? 'bg-accent text-accent-foreground'
                                            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                                    )}
                                >
                                    <Icon className="h-3 w-3" />
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-3">
                {hasData ? children : (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground text-sm">{noDataLabel}</p>
                    </div>
                )}
            </div>

            {menuOpen && (
                <div className="absolute right-2 top-2 z-50 min-w-[140px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                    {onCombine && (
                        <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-sm hover:bg-accent transition-colors"
                            onClick={(e) => { e.stopPropagation(); onCombine(); closeMenu(); }}
                        >
                            <Layers className="h-3.5 w-3.5" />
                            {isCombined ? t('dashboard.edit_sources', 'Edit sources') : t('dashboard.combine_sources', 'Combine with...')}
                        </button>
                    )}
                    {onRename && (
                        <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-sm hover:bg-accent transition-colors"
                            onClick={(e) => { e.stopPropagation(); onRename(); closeMenu(); }}
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            {t('dashboard.widget.rename')}
                        </button>
                    )}
                    <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={(e) => { e.stopPropagation(); onRemove(); closeMenu(); }}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t('dashboard.widget.delete')}
                    </button>
                </div>
            )}
        </div>
    );
}
