import { cn } from '@/lib/utils';
import { BarChart3, GripVertical, LineChart, Pencil, Table, Trash2 } from 'lucide-react';
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
}: WidgetWrapperProps) {
    const { t } = useTranslation();
    const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuPos({ x: e.clientX, y: e.clientY });
    }, []);

    const closeMenu = useCallback(() => setMenuPos(null), []);

    useEffect(() => {
        if (!menuPos) return;
        const handleClick = () => closeMenu();
        document.addEventListener('click', handleClick, { once: true });
        return () => document.removeEventListener('click', handleClick);
    }, [menuPos, closeMenu]);

    const modes = availableModes ?? ['stat', 'chart', 'table'];

    const menuStyle = menuPos
        ? {
            position: 'fixed' as const,
            left: Math.min(menuPos.x, window.innerWidth - 200),
            top: Math.min(menuPos.y, window.innerHeight - 120),
            zIndex: 50,
        }
        : undefined;

    return (
        <>
            <div
                className={cn('flex h-full flex-col rounded border bg-card', className)}
                onContextMenu={handleContextMenu}
            >
                <div className="drag-handle flex cursor-grab items-center justify-between border-b px-3 py-2 active:cursor-grabbing">
                    <div className="flex items-center gap-2">
                        <GripVertical className="text-muted-foreground h-3.5 w-3.5" />
                        <span className="text-sm font-medium leading-none">{title}</span>
                    </div>
                    {onModeChange && modes.length > 1 && (
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
            </div>

            {menuPos && (
                <div
                    ref={menuRef}
                    className="bg-popover text-popover-foreground rounded-md border p-1 shadow-md"
                    style={menuStyle}
                >
                    {onRename && (
                        <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-sm hover:bg-accent transition-colors"
                            onClick={() => { onRename(); closeMenu(); }}
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            {t('dashboard.widget.rename')}
                        </button>
                    )}
                    <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => { onRemove(); closeMenu(); }}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t('dashboard.widget.delete')}
                    </button>
                </div>
            )}
        </>
    );
}
