<?php

namespace App\Domains\Team\Events;

use App\Models\Team;

class TeamDeletedEvent extends TeamEvent
{
    public function __construct(
        Team $team,
        public readonly int $deletedBy,
        array $metadata = [],
    ) {
        parent::__construct($team, $deletedBy, $team->id, $metadata);
    }

    public function getAction(): string
    {
        return 'deleted';
    }
}
