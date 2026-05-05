<?php

namespace App\Concerns;

use Illuminate\Database\Eloquent\Builder;

/**
 * Has Query Scopes Trait
 *
 * Provides common query scopes for models.
 * Use this trait in Eloquent models for consistent filtering.
 */
trait HasQueryScopes
{
    /**
     * Scope to filter by active status.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter by inactive status.
     */
    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('is_active', false);
    }

    /**
     * Scope to search by a specific field.
     */
    public function scopeSearch(Builder $query, string $term, string $field = 'name'): Builder
    {
        return $query->where($field, 'like', '%'.$term.'%');
    }

    /**
     * Scope to filter by a date range.
     */
    public function scopeDateBetween(Builder $query, string $column, string $from, string $to): Builder
    {
        return $query->whereBetween($column, [$from, $to]);
    }

    /**
     * Scope to filter by created date range.
     */
    public function scopeCreatedBetween(Builder $query, string $from, string $to): Builder
    {
        return $query->whereBetween('created_at', [$from, $to]);
    }

    /**
     * Scope to order by latest.
     */
    public function scopeLatest(Builder $query): Builder
    {
        return $query->orderBy('created_at', 'desc');
    }

    /**
     * Scope to order by oldest.
     */
    public function scopeOldest(Builder $query): Builder
    {
        return $query->orderBy('created_at', 'asc');
    }

    /**
     * Scope to filter by IDs.
     *
     * @param  array<int>  $ids
     */
    public function scopeWhereIdsIn(Builder $query, array $ids): Builder
    {
        return $query->whereIn('id', $ids);
    }

    /**
     * Scope to exclude specific IDs.
     *
     * @param  array<int>  $ids
     */
    public function scopeWhereIdsNotIn(Builder $query, array $ids): Builder
    {
        return $query->whereNotIn('id', $ids);
    }

    /**
     * Scope to filter by slug.
     */
    public function scopeWhereSlug(Builder $query, string $slug): Builder
    {
        return $query->where('slug', $slug);
    }

    /**
     * Scope to filter by slugs.
     *
     * @param  array<string>  $slugs
     */
    public function scopeWhereSlugsIn(Builder $query, array $slugs): Builder
    {
        return $query->whereIn('slug', $slugs);
    }

    /**
     * Scope to search in multiple fields.
     *
     * @param  array<string>  $fields
     */
    public function scopeSearchIn(Builder $query, string $term, array $fields): Builder
    {
        return $query->where(function (Builder $q) use ($term, $fields) {
            foreach ($fields as $field) {
                $q->orWhere($field, 'like', '%'.$term.'%');
            }
        });
    }

    /**
     * Scope to filter by team.
     */
    public function scopeForTeam(Builder $query, int $teamId): Builder
    {
        return $query->where('team_id', $teamId);
    }

    /**
     * Scope to filter by user.
     */
    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to get records with relationships.
     *
     * @param  array<string>  $relations
     */
    public function scopeWithRelations(Builder $query, array $relations): Builder
    {
        return $query->with($relations);
    }
}
