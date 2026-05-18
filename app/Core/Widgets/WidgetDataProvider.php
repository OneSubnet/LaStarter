<?php

namespace App\Core\Widgets;

use App\Core\Modules\Contracts\ProvidesWidgetData;
use App\Core\Modules\ModuleApiRegistry;

final class WidgetDataProvider
{
    public function __construct(
        private readonly ModuleApiRegistry $registry,
    ) {}

    /**
     * Resolve data for a single widget.
     *
     * @return array<string, mixed>|null
     */
    public function resolve(string $identifier, int $teamId, ?string $dateFrom = null, ?string $dateTo = null): ?array
    {
        foreach ($this->registry->registered() as $contract) {
            $impl = $this->registry->get($contract);

            if ($impl instanceof ProvidesWidgetData && in_array($identifier, $impl->supportedWidgets(), true)) {
                return $impl->widgetData($identifier, $teamId, $dateFrom, $dateTo);
            }
        }

        return null;
    }

    /**
     * Resolve data for a batch of widgets.
     *
     * @param  list<array{id: string, identifier: string, config?: array<string, mixed>|null}>  $widgets
     * @return array<string, array<string, mixed>|null>
     */
    public function resolveBatch(array $widgets, int $teamId, ?string $dateFrom = null, ?string $dateTo = null): array
    {
        $results = [];
        $resolver = app(CombinedWidgetResolver::class);

        foreach ($widgets as $widget) {
            $key = $widget['identifier'] === 'combined' ? $widget['id'] : $widget['identifier'];

            if ($widget['identifier'] === 'combined') {
                $sources = $widget['config']['sources'] ?? [];
                $chartType = $widget['config']['chartType'] ?? 'composed';
                $results[$key] = $resolver->resolve($sources, $teamId, $dateFrom, $dateTo, $chartType);
            } else {
                $results[$key] = $this->resolve($widget['identifier'], $teamId, $dateFrom, $dateTo);
            }
        }

        return $results;
    }
}
