<?php

namespace App\Core\Hooks\Events;

readonly class ExtensionStateChangedEvent
{
    public function __construct(
        public string $identifier,
        public ?int $teamId = null,
    ) {}
}
