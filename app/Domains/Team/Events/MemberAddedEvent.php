<?php

namespace App\Domains\Team\Events;

use App\Models\Team;

class MemberAddedEvent extends TeamEvent
{
    public function __construct(
        Team $team,
        public readonly int $userId,
        public readonly string $role,
        public readonly int $addedBy,
    ) {
        parent::__construct($team, $addedBy, $team->id, [
            'member_id' => $userId,
            'role' => $role,
        ]);
    }

    public function getAction(): string
    {
        return 'member_added';
    }
}
