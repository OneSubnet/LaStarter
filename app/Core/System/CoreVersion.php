<?php

namespace App\Core\System;

final readonly class CoreVersion
{
    public function __construct(
        public string $current,
        public ?string $latest = null,
        public ?string $changelog = null,
        public bool $updateAvailable = false,
    ) {}

    public static function current(): self
    {
        return new self(
            current: config('lastarter.version', '1.0.0'),
        );
    }

    public function isUpToDate(): bool
    {
        return ! $this->updateAvailable;
    }
}
