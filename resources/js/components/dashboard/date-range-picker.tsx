import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/lib/format';
import type { DateRange as CalendarDateRange } from 'react-day-picker';
import type { DatePreset } from '@/types/dashboard';

type DateRangePickerProps = {
    range: { from: string; to: string } | null;
    onRangeChange: (range: { from: string; to: string } | null) => void;
};

const PRESETS: { key: DatePreset; days: number }[] = [
    { key: '7d', days: 7 },
    { key: '30d', days: 30 },
    { key: '90d', days: 90 },
    { key: '1y', days: 365 },
];

function getPresetLabel(key: DatePreset): string {
    const map: Record<DatePreset, string> = {
        '7d': '7d',
        '30d': '30d',
        '90d': '90d',
        '1y': '1y',
        custom: 'Custom',
    };
    return map[key];
}

export function DateRangePicker({ range, onRangeChange }: DateRangePickerProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    const selected: CalendarDateRange | undefined = range
        ? { from: new Date(range.from), to: new Date(range.to) }
        : undefined;

    const handlePreset = (days: number) => {
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - days);
        onRangeChange({ from: from.toISOString(), to: to.toISOString() });
        setOpen(false);
    };

    const handleCalendarSelect = (calRange: CalendarDateRange | undefined) => {
        if (calRange?.from && calRange?.to) {
            onRangeChange({
                from: calRange.from.toISOString(),
                to: calRange.to.toISOString(),
            });
        } else if (calRange?.from) {
            onRangeChange({
                from: calRange.from.toISOString(),
                to: calRange.from.toISOString(),
            });
        }
    };

    const label = range
        ? `${formatDate(range.from, { month: 'short', day: 'numeric' })} — ${formatDate(range.to, { month: 'short', day: 'numeric' })}`
        : t('dashboard.toolbar.all_time');

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{label}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="flex gap-2 border-b p-3">
                    {PRESETS.map((p) => (
                        <Button
                            key={p.key}
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handlePreset(p.days)}
                        >
                            {getPresetLabel(p.key)}
                        </Button>
                    ))}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => onRangeChange(null)}
                    >
                        {t('dashboard.toolbar.all_time')}
                    </Button>
                </div>
                <Calendar
                    mode="range"
                    selected={selected}
                    onSelect={handleCalendarSelect}
                    numberOfMonths={2}
                />
            </PopoverContent>
        </Popover>
    );
}
