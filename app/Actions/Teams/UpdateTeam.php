<?php

namespace App\Actions\Teams;

use App\Models\Team;
use Illuminate\Support\Facades\DB;

class UpdateTeam
{
    public function handle(Team $team, string $name): Team
    {
        return DB::transaction(function () use ($team, $name) {
            $team = Team::whereKey($team->id)->lockForUpdate()->firstOrFail();
            $team->update(['name' => $name]);

            return $team;
        });
    }
}
