import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { WIDGET_ICON_MAP, WIDGET_TEMPLATES } from './widget-picker.config';
import type { DashboardWidget } from '@/types/dashboard';

export default function WidgetPicker({ onSelect }: { onSelect: (widget: DashboardWidget) => void }) {
    const { t } = useTranslation();

    return (
        <div className="grid grid-cols-2 gap-3">
            {WIDGET_TEMPLATES.map((tmpl) => {
                const Icon = WIDGET_ICON_MAP[tmpl.icon] ?? WIDGET_ICON_MAP.Grid3x3;
                return (
                    <Button
                        key={tmpl.id}
                        variant="outline"
                        className="flex h-auto flex-col items-center gap-2 p-4"
                        onClick={() =>
                            onSelect({
                                id: `${tmpl.id}-${Date.now()}`,
                                title: t(tmpl.label),
                                description: '',
                                icon: tmpl.icon,
                                type: tmpl.type,
                                value: null,
                                order: 0,
                            })
                        }
                    >
                        <Icon className="h-6 w-6 text-muted-foreground" />
                        <span className="text-xs font-medium">{t(tmpl.label)}</span>
                    </Button>
                );
            })}
        </div>
    );
}
