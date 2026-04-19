<?php

namespace Modules\Projects\Policies;

use App\Models\User;
use Modules\Projects\Models\Project;

class ProjectPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('project.view');
    }

    public function view(User $user, Project $project): bool
    {
        return $user->hasPermissionTo('project.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('project.create');
    }

    public function update(User $user, Project $project): bool
    {
        return $user->hasPermissionTo('project.update');
    }

    public function delete(User $user, Project $project): bool
    {
        return $user->hasPermissionTo('project.delete');
    }
}
