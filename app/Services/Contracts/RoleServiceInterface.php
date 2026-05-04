<?php

namespace App\Services\Contracts;

use App\Models\Team;
use Illuminate\Database\Eloquent\Collection;
use Spatie\Permission\Models\Role;

interface RoleServiceInterface
{
    public function getAllForTeam(int $teamId): Collection;

    public function findById(int $id, int $teamId): ?Role;

    public function findByName(string $name, int $teamId): ?Role;

    public function createRole(Team $team, string $name, array $permissions = []): Role;

    public function updateRole(Role $role, string $name, array $permissions): void;

    public function deleteRole(Role $role): void;

    public function syncPermissions(Role $role, array $permissions): void;

    public function getAvailablePermissions(): array;

    public function isOwnerRole(Role $role): bool;
}
