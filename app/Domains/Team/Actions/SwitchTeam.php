<?php

namespace App\Domains\Team\Actions;

use App\Domains\Team\Events\TeamUpdatedEvent;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\Event;

/**
 * Switch Team Action
 *
 * Handles user switching between their teams.
 */
class SwitchTeam
{
    public function handle(User $user, Team $team): void
    {
        if (! $this->userBelongsToTeam($user, $team)) {
            throw new \Exception('User does not belong to this team.');
        }

        $previousTeam = $user->currentTeam;

        $user->switchTeam($team);

        // Dispatch event for team switching
        if ($previousTeam && $previousTeam->id !== $team->id) {
            Event::dispatch(new TeamUpdatedEvent($team));
        }
    }

    protected function userBelongsToTeam(User $user, Team $team): bool
    {
        return $user->belongsToTeam($team);
    }
}
