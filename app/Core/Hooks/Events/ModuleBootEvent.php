<?php

namespace App\Core\Hooks\Events;

readonly class ModuleBootEvent
{
    public function __construct(
        public string $module,
    ) {}
}
