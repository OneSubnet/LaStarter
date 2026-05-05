<?php

namespace App\Domains\Team\Events;

class TeamUpdatedEvent extends TeamEvent
{
    public function getAction(): string
    {
        return 'updated';
    }
}
