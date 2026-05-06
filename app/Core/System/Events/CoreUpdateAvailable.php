<?php

namespace App\Core\System\Events;

final readonly class CoreUpdateAvailable
{
    public function __construct(
        public string $currentVersion,
        public string $latestVersion,
        public ?string $changelog,
    ) {}
}
