<?php

namespace Modules\Tasks\Policies;

use App\Models\User;
use Modules\Tasks\Models\Task;

class TaskPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('task.view');
    }

    public function view(User $user, Task $task): bool
    {
        return $user->hasPermissionTo('task.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('task.create');
    }

    public function update(User $user, Task $task): bool
    {
        return $user->hasPermissionTo('task.update');
    }

    public function delete(User $user, Task $task): bool
    {
        return $user->hasPermissionTo('task.delete');
    }
}
