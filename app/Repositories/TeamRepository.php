<?php

namespace App\Repositories;

use App\Models\Team;
use Illuminate\Database\Eloquent\Collection;

/**
 * Team Repository
 *
 * Handles all data access operations for Team model.
 */
class TeamRepository extends AbstractRepository
{
    /**
     * Create a new repository instance.
     */
    public function __construct(Team $model)
    {
        parent::__construct($model);
    }

    /**
     * Find a team by slug.
     */
    public function findBySlug(string $slug): ?Team
    {
        return $this->findBy('slug', $slug);
    }

    /**
     * Find a team by slug or throw an exception.
     */
    public function findBySlugOrFail(string $slug): Team
    {
        return $this->findByOrFail('slug', $slug);
    }

    /**
     * Get all teams for a specific user.
     *
     * @return Collection<int, Team>
     */
    public function forUser(int $userId): Collection
    {
        return $this->query()
            ->whereHas('memberships', fn ($q) => $q->where('user_id', $userId))
            ->with('memberships')
            ->get();
    }

    /**
     * Get all teams with their member count.
     *
     * @return Collection<int, Team>
     */
    public function withMemberCount(): Collection
    {
        return $this->query()
            ->withCount('memberships')
            ->get();
    }

    /**
     * Search teams by name.
     *
     * @return Collection<int, Team>
     */
    public function searchByName(string $query): Collection
    {
        return $this->query()
            ->where('name', 'like', "%{$query}%")
            ->limit(10)
            ->get();
    }

    /**
     * Get active teams (not deleted/soft deleted if applicable).
     *
     * @return Collection<int, Team>
     */
    public function getActive(): Collection
    {
        return $this->all();
    }

    /**
     * Check if a slug is already taken.
     */
    public function slugExists(string $slug, ?int $excludeId = null): bool
    {
        $query = $this->query()->where('slug', $slug);

        if ($excludeId !== null) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    /**
     * Get teams by creation date range.
     *
     * @return Collection<int, Team>
     */
    public function getByDateRange(string $from, string $to): Collection
    {
        return $this->query()
            ->whereBetween('created_at', [$from, $to])
            ->get();
    }
}
