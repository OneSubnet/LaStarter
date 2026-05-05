<?php

namespace App\Domains\User\Events;

use App\Models\User;

class UserDeletedEvent extends UserEvent
{
    public function __construct(
        User $user,
        public readonly int $deletedBy,
        array $metadata = [],
    ) {
        parent::__construct($user, $deletedBy, $metadata);
    }

    public function getAction(): string
    {
        return 'deleted';
    }
}
