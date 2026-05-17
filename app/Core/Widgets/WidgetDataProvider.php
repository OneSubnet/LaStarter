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
     * @param  list<array{id: string, identifier: string}>  $widgets
     * @return array<string, array<string, mixed>|null>
     */
    public function resolveBatch(array $widgets, int $teamId, ?string $dateFrom = null, ?string $dateTo = null): array
    {
        $results = [];

        foreach ($widgets as $widget) {
            $results[$widget['identifier']] = $this->resolve($widget['identifier'], $teamId, $dateFrom, $dateTo);
        }

        return $results;
    }
}
