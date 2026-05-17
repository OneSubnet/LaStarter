<?php

namespace App\Core\Modules\Contracts;

interface ProvidesWidgetData
{
    /**
     * Return data for a specific widget.
     *
     * @return array<string, mixed>|null
     */
    public function widgetData(string $widgetIdentifier, int $teamId, ?string $dateFrom = null, ?string $dateTo = null): ?array;

    /**
     * Return the widget identifiers this provider supports.
     *
     * @return list<string>
     */
    public function supportedWidgets(): array;
}
