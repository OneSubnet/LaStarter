<?php

namespace Modules\AilesInvisibles\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConversationAuditLog extends Model
{
    protected $table = 'ai_conversation_audit_logs';

    protected $fillable = [
        'conversation_id',
        'event',
        'actor_type',
        'actor_id',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }
}
