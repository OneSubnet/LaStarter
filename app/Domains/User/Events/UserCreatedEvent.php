<?php

namespace App\Domains\User\Events;

class UserCreatedEvent extends UserEvent
{
    public function getAction(): string
    {
        return 'created';
    }
}
