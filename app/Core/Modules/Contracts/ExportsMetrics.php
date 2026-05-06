<?php

namespace App\Core\Modules\Contracts;

interface ExportsMetrics
{
    /**
     * Return metric definitions for this module.
     *
     * @return list<array{key: string, label: string, type: string, description?: string}>
     */
    public function metricDefinitions(): array;

    /**
     * Return current metric values for a team.
     *
     * @return array<string, int|float>
     */
    public function metricValues(int $teamId): array;
}
