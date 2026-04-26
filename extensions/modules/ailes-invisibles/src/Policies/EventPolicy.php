<?php

namespace Modules\AilesInvisibles\Policies;

use App\Models\User;
use Modules\AilesInvisibles\Models\Event;

class EventPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('ai.event.view');
    }

    public function view(User $user, Event $event): bool
    {
        return $user->hasPermissionTo('ai.event.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('ai.event.create');
    }

    public function update(User $user, Event $event): bool
    {
        return $user->hasPermissionTo('ai.event.update');
    }

    public function delete(User $user, Event $event): bool
    {
        return $user->hasPermissionTo('ai.event.delete');
    }
}
