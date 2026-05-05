<?php

namespace App\Domains\Team\Commands;

use App\Domain\Commands\Command;
use App\Models\Team;

/**
 * Delete Team Command
 */
class DeleteTeamCommand implements Command
{
    public function __construct(
        public readonly int $userId,
        public readonly Team $team,
    ) {}

    public function commandId(): string
    {
        return spl_object_hash($this);
    }
}
