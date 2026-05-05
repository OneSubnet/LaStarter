<?php

namespace App\Domains\Team\Commands\Handlers;

use App\Domain\Commands\Command;
use App\Domain\Commands\CommandHandler;
use App\Domains\Team\Commands\UpdateTeamCommand;
use App\Domains\Team\Events\TeamUpdatedEvent;
use App\Models\Team;
use Illuminate\Support\Facades\Event;

/**
 * Update Team Command Handler
 */
class UpdateTeamHandler implements CommandHandler
{
    public function handle(Command|UpdateTeamCommand $command): Team
    {
        $command->team->update(['name' => $command->name]);

        Event::dispatch(new TeamUpdatedEvent($command->team));

        return $command->team->fresh();
    }
}
