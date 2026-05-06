<?php

namespace App\Core\Modules;

use App\Core\Modules\Contracts\ExportsMetrics;

final class MetricsAggregator
{
    public function __construct(
        private readonly ModuleApiRegistry $registry,
    ) {}

    /**
     * Aggregate metrics from all modules that export them.
     *
     * @return list<array{module: string, metrics: array<string, int|float>, definitions: list<array{key: string, label: string, type: string}>}>
     */
    public function aggregate(int $teamId): array
    {
        $results = [];

        foreach ($this->registry->registered() as $contract) {
            $impl = $this->registry->get($contract);

            if ($impl instanceof ExportsMetrics) {
                $results[] = [
                    'module' => $contract,
                    'definitions' => $impl->metricDefinitions(),
                    'metrics' => $impl->metricValues($teamId),
                ];
            }
        }

        return $results;
    }
}
