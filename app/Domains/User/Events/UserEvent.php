<?php

namespace App\Domains\User\Events;

use App\Domains\Cms\Event\ResourceEvent;
use App\Models\User;

/**
 * Base event for User domain operations.
 */
abstract class UserEvent extends ResourceEvent
{
    public function __construct(
        User $user,
        public readonly ?int $actorId = null,
        array $metadata = [],
    ) {
        parent::__construct($user, null, $user->current_team_id, $metadata);
        $this->actorId = $actorId ?? $user->id;
    }

    public function getUser(): User
    {
        return $this->model;
    }
}
