<?php

namespace App\Core\Extensions\Updater\Events;

final readonly class ExtensionUpdateCompleted
{
    public function __construct(
        public string $identifier,
        public string $fromVersion,
        public string $toVersion,
    ) {}
}
