<?php

namespace Modules\AilesInvisibles\Services;

use Illuminate\Database\Eloquent\Model;
use Modules\AilesInvisibles\Models\Conversation;
use Modules\AilesInvisibles\Models\ConversationAuditLog;

class ConversationAuditService
{
    public function log(Conversation $conversation, string $event, ?Model $actor = null, array $metadata = []): ConversationAuditLog
    {
        return ConversationAuditLog::create([
            'conversation_id' => $conversation->id,
            'event' => $event,
            'actor_type' => $actor ? get_class($actor) : null,
            'actor_id' => $actor?->id,
            'metadata' => ! empty($metadata) ? $metadata : null,
        ]);
    }
}
