<?php

namespace App\Domains\Team\Actions;

use App\Domains\Team\Events\TeamUpdatedEvent;
use App\Models\Team;
use App\Repositories\TeamRepository;
use Illuminate\Support\Facades\Event;

/**
 * Update Team Action
 *
 * Handles team name updates with proper locking.
 */
class UpdateTeam
{
    public function __construct(
        protected TeamRepository $teamRepository,
    ) {}

    public function handle(Team $team, string $name): Team
    {
        return $this->teamRepository->transaction(function () use ($team, $name) {
            $team = $this->teamRepository->query()
                ->whereKey($team->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->teamRepository->update($team, ['name' => $name]);

            Event::dispatch(new TeamUpdatedEvent($team));

            return $team;
        });
    }
}
