<?php

namespace App\Core\System\Events;

final readonly class BackupDeleted
{
    public function __construct(
        public string $filename,
        public string $type,
    ) {}
}
