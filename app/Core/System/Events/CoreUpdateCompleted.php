<?php

namespace App\Core\System\Events;

final readonly class CoreUpdateCompleted
{
    public function __construct(
        public string $fromVersion,
        public string $toVersion,
        public ?string $backupPath,
    ) {}
}
