<?php

namespace Modules\Forms\Policies;

use App\Models\User;
use Modules\Forms\Models\Form;

class FormPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('form.view');
    }

    public function view(User $user, Form $form): bool
    {
        return $user->hasPermissionTo('form.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('form.create');
    }

    public function update(User $user, Form $form): bool
    {
        return $user->hasPermissionTo('form.update');
    }

    public function delete(User $user, Form $form): bool
    {
        return $user->hasPermissionTo('form.delete');
    }

    public function publish(User $user, Form $form): bool
    {
        return $user->hasPermissionTo('form.publish');
    }
}
