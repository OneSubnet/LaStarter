<?php

namespace Modules\AilesInvisibles\Policies;

use App\Models\User;
use Modules\AilesInvisibles\Models\Product;

class ProductPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('ai.product.view');
    }

    public function view(User $user, Product $product): bool
    {
        return $user->hasPermissionTo('ai.product.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('ai.product.create');
    }

    public function update(User $user, Product $product): bool
    {
        return $user->hasPermissionTo('ai.product.update');
    }

    public function delete(User $user, Product $product): bool
    {
        return $user->hasPermissionTo('ai.product.delete');
    }
}
