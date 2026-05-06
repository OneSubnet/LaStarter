<?php

namespace App\Core\Metrics;

final readonly class MetricDefinition
{
    public function __construct(
        public string $key,
        public string $label,
        public string $type,
        public ?string $description = null,
    ) {}
}
