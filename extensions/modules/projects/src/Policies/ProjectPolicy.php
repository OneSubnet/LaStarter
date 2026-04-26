<?php

namespace Modules\Projects\Policies;

use App\Models\User;

class ProjectPolicy
{
    public function view(User $user): bool
    {
        return $user->hasPermissionTo('project.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('project.create');
    }

    public function update(User $user): bool
    {
        return $user->hasPermissionTo('project.update');
    }

    public function delete(User $user): bool
    {
        return $user->hasPermissionTo('project.delete');
    }
}
