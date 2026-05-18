<?php

namespace App\Core\Widgets;

final class CombinedWidgetResolver
{
    private const COLOR_PALETTE = [
        'var(--chart-1)',
        'var(--chart-2)',
        'var(--chart-3)',
        'var(--chart-4)',
        'var(--chart-5)',
    ];

    public function __construct(
        private readonly WidgetDataProvider $dataProvider,
        private readonly WidgetRegistry $registry,
    ) {}

    /**
     * Resolve combined chart data from multiple widget sources.
     *
     * @param  list<string>  $sources  Widget identifiers (max 4)
     * @return array{chart: array<string, mixed>, warnings: list<string>, sources: list<array{identifier: string, label: string}>}
     */
    public function resolve(
        array $sources,
        int $teamId,
        ?string $dateFrom = null,
        ?string $dateTo = null,
        string $chartType = 'composed',
    ): array {
        $sources = array_slice(array_values(array_unique($sources)), 0, 4);

        $chartDatasets = [];
        $warnings = [];
        $sourceMeta = [];

        foreach ($sources as $idx => $sourceId) {
            $data = $this->dataProvider->resolve($sourceId, $teamId, $dateFrom, $dateTo);

            if ($data === null || ! isset($data['chart'])) {
                $warnings[] = $sourceId;

                continue;
            }

            $chart = $data['chart'];
            $def = $this->registry->all();
            $label = $sourceId;

            foreach ($def as $d) {
                if ($d->identifier === $sourceId) {
                    $label = $d->label;
                    break;
                }
            }

            $sourceMeta[] = ['identifier' => $sourceId, 'label' => $label];
            $color = self::COLOR_PALETTE[$idx % count(self::COLOR_PALETTE)];

            $namespacedKeys = [];
            $namespacedConfig = [];

            foreach ($chart['dataKeys'] ?? [] as $key) {
                $safeKey = $key !== '' ? $key : 'value';
                $nsKey = $sourceId.'__'.$safeKey;
                $namespacedKeys[] = $nsKey;

                $originalConfig = $chart['config'][$key] ?? null;
                $originalLabel = is_array($originalConfig) ? ($originalConfig['label'] ?? $safeKey) : $safeKey;
                $namespacedConfig[$nsKey] = [
                    'label' => $label.' / '.$originalLabel,
                    'color' => is_array($originalConfig) ? ($originalConfig['color'] ?? $color) : $color,
                ];
            }

            $xAxisKey = $chart['xAxisKey'] ?? 'date';

            $namespacedData = [];
            foreach ($chart['data'] ?? [] as $point) {
                $xVal = $point[$xAxisKey] ?? '';
                $row = [$xAxisKey => $xVal];
                foreach ($chart['dataKeys'] ?? [] as $key) {
                    $safeKey = $key !== '' ? $key : 'value';
                    $row[$sourceId.'__'.$safeKey] = $point[$key] ?? null;
                }
                $namespacedData[] = $row;
            }

            $chartDatasets[] = [
                'xAxisKey' => $xAxisKey,
                'data' => $namespacedData,
                'dataKeys' => $namespacedKeys,
                'config' => $namespacedConfig,
            ];
        }

        if ($chartDatasets === []) {
            return [
                'chart' => [
                    'type' => $chartType,
                    'data' => [],
                    'config' => [],
                    'dataKeys' => [],
                ],
                'warnings' => $warnings,
                'sources' => $sourceMeta,
            ];
        }

        $merged = $this->mergeChartData($chartDatasets, $chartType);

        return [
            'chart' => $merged,
            'warnings' => $warnings,
            'sources' => $sourceMeta,
        ];
    }

    /**
     * Full outer join of chart datasets on their shared xAxis key.
     *
     * @param  list<array{xAxisKey: string, data: list<array<string, mixed>>, dataKeys: list<string>, config: array<string, array{label: string, color?: string}>}>  $datasets
     * @return array{type: string, data: list<array<string, mixed>>, config: array<string, array{label: string, color?: string}>, xAxisKey: string, dataKeys: list<string>, stacked?: bool}
     */
    private function mergeChartData(array $datasets, string $chartType): array
    {
        $xAxisKey = $datasets[0]['xAxisKey'];
        $allConfig = [];
        $allDataKeys = [];

        foreach ($datasets as $ds) {
            $allConfig = array_merge($allConfig, $ds['config']);
            $allDataKeys = array_merge($allDataKeys, $ds['dataKeys']);
        }

        if (count($datasets) === 1) {
            return [
                'type' => $chartType,
                'data' => $datasets[0]['data'],
                'config' => $allConfig,
                'xAxisKey' => $xAxisKey,
                'dataKeys' => $allDataKeys,
            ];
        }

        $indexed = [];
        foreach ($datasets as $ds) {
            foreach ($ds['data'] as $point) {
                $xVal = (string) ($point[$xAxisKey] ?? '');
                if (! isset($indexed[$xVal])) {
                    $indexed[$xVal] = [$xAxisKey => $xVal];
                }
                foreach ($ds['dataKeys'] as $key) {
                    $indexed[$xVal][$key] = $point[$key] ?? null;
                }
            }
        }

        ksort($indexed);

        return [
            'type' => $chartType,
            'data' => array_values($indexed),
            'config' => $allConfig,
            'xAxisKey' => $xAxisKey,
            'dataKeys' => $allDataKeys,
        ];
    }
}
