<?php

namespace Modules\AilesInvisibles\Policies;

use App\Models\User;
use Modules\AilesInvisibles\Models\Category;

class CategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('ai.category.view');
    }

    public function view(User $user, Category $category): bool
    {
        return $user->hasPermissionTo('ai.category.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('ai.category.create');
    }

    public function update(User $user, Category $category): bool
    {
        return $user->hasPermissionTo('ai.category.update');
    }

    public function delete(User $user, Category $category): bool
    {
        return $user->hasPermissionTo('ai.category.delete');
    }
}
