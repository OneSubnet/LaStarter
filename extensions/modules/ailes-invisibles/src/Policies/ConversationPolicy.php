<?php

namespace Modules\AilesInvisibles\Policies;

use App\Models\User;
use Modules\AilesInvisibles\Models\Conversation;

class ConversationPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('ai.messaging.view');
    }

    public function view(User $user, Conversation $conversation): bool
    {
        return $user->hasPermissionTo('ai.messaging.view');
    }

    public function send(User $user, Conversation $conversation): bool
    {
        return $user->hasPermissionTo('ai.messaging.send');
    }
}
