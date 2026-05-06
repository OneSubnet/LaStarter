<?php

namespace App\Core\Extensions\Events;

final readonly class ExtensionUninstalled
{
    public function __construct(
        public string $identifier,
    ) {}
}
