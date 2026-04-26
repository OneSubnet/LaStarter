<?php

namespace App\Policies;

use App\Models\User;

class ExtensionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('extension.view');
    }

    public function manage(User $user): bool
    {
        return $user->hasPermissionTo('extension.manage');
    }
}
