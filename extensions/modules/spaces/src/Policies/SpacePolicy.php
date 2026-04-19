<?php

namespace Modules\Spaces\Policies;

use App\Models\User;
use Modules\Spaces\Models\Space;

class SpacePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('space.view');
    }

    public function view(User $user, Space $space): bool
    {
        return $user->hasPermissionTo('space.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('space.create');
    }

    public function update(User $user, Space $space): bool
    {
        return $user->hasPermissionTo('space.update');
    }

    public function delete(User $user, Space $space): bool
    {
        return $user->hasPermissionTo('space.delete');
    }

    public function manageMembers(User $user, Space $space): bool
    {
        return $user->hasPermissionTo('space.manage-members');
    }
}
