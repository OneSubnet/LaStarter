<?php

namespace App\Domains\Team\Commands;

use App\Domain\Commands\Command;

/**
 * Create Team Command
 */
class CreateTeamCommand implements Command
{
    public function __construct(
        public readonly int $ownerId,
        public readonly string $name,
        public readonly bool $isPersonal = false,
    ) {}

    public function commandId(): string
    {
        return spl_object_hash($this);
    }
}
