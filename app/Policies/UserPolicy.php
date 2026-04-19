<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function view(User $user, User $model): bool
    {
        return $user->hasPermissionTo('user.view');
    }

    public function update(User $user, User $model): bool
    {
        return $user->hasPermissionTo('user.update');
    }

    public function delete(User $user, User $model): bool
    {
        return $user->hasPermissionTo('user.delete');
    }

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('user.view');
    }
}
