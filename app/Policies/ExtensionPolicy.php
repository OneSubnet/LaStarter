<?php

namespace App\Policies;

use App\Models\Extension;
use App\Models\User;

class ExtensionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('extension.view');
    }

    public function manage(User $user, Extension $extension): bool
    {
        return $user->hasPermissionTo('extension.manage');
    }
}
