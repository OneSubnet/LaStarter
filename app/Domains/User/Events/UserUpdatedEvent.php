<?php

namespace App\Domains\User\Events;

class UserUpdatedEvent extends UserEvent
{
    public function getAction(): string
    {
        return 'updated';
    }
}
