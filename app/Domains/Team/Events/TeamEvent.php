<?php

namespace App\Domains\Team\Events;

use App\Domains\Cms\Event\ResourceEvent;
use App\Models\Team;

/**
 * Base event for Team domain operations.
 */
abstract class TeamEvent extends ResourceEvent
{
    public readonly ?int $userId;

    public function __construct(
        Team $team,
        ?int $userId = null,
        ?int $teamId = null,
        array $metadata = [],
    ) {
        $this->userId = $userId;
        parent::__construct($team, null, $teamId ?? $team->id, $metadata);
    }

    public function getTeam(): Team
    {
        return $this->model;
    }
}
