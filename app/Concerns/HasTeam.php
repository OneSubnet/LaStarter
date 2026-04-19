<?php

namespace App\Concerns;

use App\Models\Team;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class TeamScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     * Automatically filters queries to the current team context.
     */
    public function apply(Builder $builder, Model $model): void
    {
        $teamId = $this->currentTeamId();

        if ($teamId !== null) {
            $builder->where($model->getTable().'.team_id', $teamId);
        }
    }

    /**
     * Get the current team ID from the session/auth context.
     */
    protected function currentTeamId(): ?int
    {
        return auth()->user()?->current_team_id;
    }
}

trait HasTeam
{
    /**
     * Boot the HasTeam trait.
     */
    protected static function bootHasTeam(): void
    {
        static::addGlobalScope(new TeamScope);

        static::creating(function (Model $model) {
            if (empty($model->team_id)) {
                $model->team_id = auth()->user()?->current_team_id;
            }
        });
    }

    /**
     * Get the team that owns this model.
     */
    public function team()
    {
        return $this->belongsTo(Team::class);
    }
}
