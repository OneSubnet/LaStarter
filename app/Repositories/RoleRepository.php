<?php

namespace App\Repositories;

use App\Repositories\Contracts\RoleRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Spatie\Permission\Models\Role;

class RoleRepository extends AbstractRepository implements RoleRepositoryInterface
{
    public function __construct(Role $model)
    {
        $this->model = $model;
    }

    public function findByTeam(int $teamId): Collection
    {
        return $this->model->where('team_id', $teamId)->get();
    }

    public function findByIdentifier(int $teamId, string $name): ?Role
    {
        return $this->model
            ->where('team_id', $teamId)
            ->where('name', $name)
            ->first();
    }

    public function findOwnerRole(int $teamId): ?Role
    {
        return $this->model
            ->where('team_id', $teamId)
            ->where('name', 'Owner')
            ->first();
    }

    public function getAllForTeam(int $teamId): Collection
    {
        return $this->model
            ->where('team_id', $teamId)
            ->with('permissions')
            ->get();
    }

    public function getWithPermissions(int $roleId): Role
    {
        return $this->model->with('permissions')->findOrFail($roleId);
    }
}
