<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;
use Modules\AilesInvisibles\Models\ClientUser;
use Modules\AilesInvisibles\Models\ConversationParticipant;

Broadcast::channel('conversation.{id}', function ($user, $id) {
    return ConversationParticipant::where('conversation_id', $id)
        ->where('participant_type', User::class)
        ->where('participant_id', $user->id)
        ->exists();
});

Broadcast::channel('conversation.{id}', function (ClientUser $clientUser, $id) {
    return ConversationParticipant::where('conversation_id', $id)
        ->where('participant_type', ClientUser::class)
        ->where('participant_id', $clientUser->id)
        ->exists();
});
