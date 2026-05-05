<?php

namespace App\Concerns;

use App\Core\Context\AppContext;
use Illuminate\Database\Eloquent\Builder;

/**
 * Has Team Query Scopes Trait
 *
 * Provides team-specific query scopes for models with HasTeam trait.
 */
trait HasTeamQueryScopes
{
    /**
     * Scope to automatically filter by current team.
     */
    public function scopeWithTeam(Builder $query): Builder
    {
        $team = app(AppContext::class)->team();

        return $team ? $query->where('team_id', $team->id) : $query;
    }

    /**
     * Scope to filter by specific team.
     */
    public function scopeForTeam(Builder $query, int $teamId): Builder
    {
        return $query->where('team_id', $teamId);
    }

    /**
     * Scope to filter by multiple teams.
     *
     * @param  array<int>  $teamIds
     */
    public function scopeForTeams(Builder $query, array $teamIds): Builder
    {
        return $query->whereIn('team_id', $teamIds);
    }

    /**
     * Scope to exclude teams.
     *
     * @param  array<int>  $teamIds
     */
    public function scopeWhereTeamNotIn(Builder $query, array $teamIds): Builder
    {
        return $query->whereNotIn('team_id', $teamIds);
    }

    /**
     * Scope to get personal team records only.
     */
    public function scopePersonal(Builder $query): Builder
    {
        return $query->where('is_personal', true);
    }

    /**
     * Scope to get non-personal team records only.
     */
    public function scopeNotPersonal(Builder $query): Builder
    {
        return $query->where('is_personal', false);
    }
}
