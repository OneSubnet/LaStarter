<?php

namespace App\Core\Extensions\Events;

use App\Models\Extension;

final readonly class ExtensionDisabled
{
    public function __construct(
        public Extension $extension,
        public int $teamId,
    ) {}
}
