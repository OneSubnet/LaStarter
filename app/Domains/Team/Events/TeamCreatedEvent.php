<?php

namespace App\Domains\Team\Events;

use App\Models\Team;

class TeamCreatedEvent extends TeamEvent
{
    public function __construct(
        Team $team,
        public readonly int $ownerId,
        array $metadata = [],
    ) {
        parent::__construct($team, $ownerId, $team->id, $metadata);
    }

    public function getAction(): string
    {
        return 'created';
    }
}
