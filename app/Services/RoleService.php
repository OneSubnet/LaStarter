<?php

namespace App\Services;

use App\Enums\TeamRole;
use App\Models\Team;
use App\Repositories\Contracts\RoleRepositoryInterface;
use App\Services\Contracts\RoleServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Spatie\Permission\Models\Role;

class RoleService implements RoleServiceInterface
{
    public function __construct(
        private RoleRepositoryInterface $roleRepository,
    ) {}

    public function getAllForTeam(int $teamId): Collection
    {
        return $this->roleRepository->getAllForTeam($teamId);
    }

    public function findById(int $id, int $teamId): ?Role
    {
        $role = $this->roleRepository->find($id);

        if ($role && $role->team_id !== $teamId) {
            return null;
        }

        return $role;
    }

    public function findByName(string $name, int $teamId): ?Role
    {
        return $this->roleRepository->findByIdentifier($teamId, $name);
    }

    public function createRole(Team $team, string $name, array $permissions = []): Role
    {
        return $this->roleRepository->transaction(function () use ($team, $name, $permissions) {
            $role = $this->roleRepository->create([
                'team_id' => $team->id,
                'name' => $name,
                'guard_name' => 'web',
            ]);

            $this->syncPermissions($role, $permissions);

            return $role;
        });
    }

    public function updateRole(Role $role, string $name, array $permissions): void
    {
        $this->roleRepository->transaction(function () use ($role, $name, $permissions) {
            $this->roleRepository->update($role, ['name' => $name]);
            $this->syncPermissions($role, $permissions);
        });
    }

    public function deleteRole(Role $role): void
    {
        if ($this->isOwnerRole($role)) {
            throw new \InvalidArgumentException('Cannot delete the Owner role.');
        }

        $this->roleRepository->delete($role);
    }

    public function syncPermissions(Role $role, array $permissions): void
    {
        $role->syncPermissions($permissions);
    }

    public function getAvailablePermissions(): array
    {
        return collect(app()->make('permissions'))
            ->map(fn ($permission, $key) => [
                'name' => $key,
                'label' => $permission['label'] ?? $key,
                'description' => $permission['description'] ?? '',
            ])
            ->values()
            ->sortBy('label')
            ->toArray();
    }

    public function isOwnerRole(Role $role): bool
    {
        return $role->name === TeamRole::Owner->value;
    }
}
