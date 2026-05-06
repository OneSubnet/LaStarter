<?php

namespace App\Core\Extensions\Updater\Events;

final readonly class ExtensionUpdateAvailable
{
    public function __construct(
        public string $identifier,
        public string $currentVersion,
        public string $latestVersion,
    ) {}
}
