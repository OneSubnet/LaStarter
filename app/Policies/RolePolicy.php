<?php

namespace App\Policies;

use App\Enums\TeamRole;
use App\Models\User;
use Spatie\Permission\Models\Role;

class RolePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('role.view');
    }

    public function view(User $user, Role $role): bool
    {
        return $user->hasPermissionTo('role.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('role.create');
    }

    public function update(User $user, Role $role): bool
    {
        if ($role->name === TeamRole::Owner->value) {
            return false;
        }

        return $user->hasPermissionTo('role.update');
    }

    public function delete(User $user, Role $role): bool
    {
        if ($role->name === TeamRole::Owner->value) {
            return false;
        }

        return $user->hasPermissionTo('role.delete');
    }

    public function belongsToTeam(User $user, Role $role): bool
    {
        $currentTeam = $user->currentTeam;

        return $currentTeam && $role->team_id === $currentTeam->id;
    }
}
