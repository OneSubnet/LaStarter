<?php

namespace App\Domains\Team\Commands;

use App\Domain\Commands\Command;
use App\Models\Team;

/**
 * Update Team Command
 */
class UpdateTeamCommand implements Command
{
    public function __construct(
        public readonly Team $team,
        public readonly string $name,
    ) {}

    public function commandId(): string
    {
        return spl_object_hash($this);
    }
}
