<?php

namespace App\Core\Widgets;

final readonly class WidgetDefinition
{
    /**
     * @param  array{w: int, h: int}  $size
     */
    public function __construct(
        public string $identifier,
        public string $label,
        public string $module,
        public string $type,
        public array $size,
        public ?string $permission = null,
        public ?string $component = null,
    ) {}
}
