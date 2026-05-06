<?php

namespace App\Core\Metrics;

final readonly class MetricValue
{
    public function __construct(
        public string $key,
        public int|float $value,
    ) {}
}
