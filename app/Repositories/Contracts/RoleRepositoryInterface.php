<?php

namespace App\Repositories\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Spatie\Permission\Models\Role;

interface RoleRepositoryInterface extends RepositoryInterface
{
    public function findByTeam(int $teamId): Collection;

    public function findByIdentifier(int $teamId, string $name): ?Role;

    public function findOwnerRole(int $teamId): ?Role;

    public function getAllForTeam(int $teamId): Collection;

    public function getWithPermissions(int $roleId): Role;
}
