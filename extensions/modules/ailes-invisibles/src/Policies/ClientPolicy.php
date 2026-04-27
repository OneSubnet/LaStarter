<?php

namespace Modules\AilesInvisibles\Policies;

use App\Models\User;
use Modules\AilesInvisibles\Models\Client;

class ClientPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('ai.client.view');
    }

    public function view(User $user, Client $client): bool
    {
        return $user->hasPermissionTo('ai.client.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('ai.client.create');
    }

    public function update(User $user, Client $client): bool
    {
        return $user->hasPermissionTo('ai.client.update');
    }

    public function delete(User $user, Client $client): bool
    {
        return $user->hasPermissionTo('ai.client.delete');
    }
}
