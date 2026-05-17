<?php

namespace App\Core\System\Events;

final readonly class BackupCreated
{
    public function __construct(
        public string $filename,
        public string $type,
        public string $path,
    ) {}
}
