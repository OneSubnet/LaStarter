<?php

namespace App\Repositories;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * User Repository
 *
 * Handles all data access operations for User model.
 */
class UserRepository extends AbstractRepository
{
    /**
     * Create a new repository instance.
     */
    public function __construct(User $model)
    {
        parent::__construct($model);
    }

    /**
     * Find a user by email.
     */
    public function findByEmail(string $email): ?User
    {
        return $this->findBy('email', $email);
    }

    /**
     * Find a user by email or throw an exception.
     */
    public function findByEmailOrFail(string $email): User
    {
        return $this->findByOrFail('email', $email);
    }

    /**
     * Get users with pagination and filtering.
     */
    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->query();

        if (isset($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%")
                    ->orWhere('email', 'like', "%{$filters['search']}%");
            });
        }

        if (isset($filters['role'])) {
            $query->whereHas('roles', function ($q) use ($filters) {
                $q->where('name', $filters['role']);
            });
        }

        return $query->with('roles')->paginate($perPage);
    }

    /**
     * Get team members for a specific team.
     *
     * @return Collection<int, User>
     */
    public function getTeamMembers(int $teamId): Collection
    {
        return $this->query()
            ->whereHas('memberships', fn ($q) => $q->where('team_id', $teamId))
            ->with(['memberships' => fn ($q) => $q->where('team_id', $teamId), 'roles'])
            ->get();
    }

    /**
     * Search users by name or email.
     *
     * @return Collection<int, User>
     */
    public function search(string $query, int $limit = 20): Collection
    {
        return $this->query()
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%");
            })
            ->limit($limit)
            ->get();
    }

    /**
     * Get users with a specific permission.
     *
     * @return Collection<int, User>
     */
    public function withPermission(string $permission, int $teamId): Collection
    {
        return $this->query()
            ->whereHas('roles', function ($q) use ($permission, $teamId) {
                $q->where('team_id', $teamId)
                    ->whereHas('permissions', fn ($pq) => $pq->where('name', $permission));
            })
            ->get();
    }
}
