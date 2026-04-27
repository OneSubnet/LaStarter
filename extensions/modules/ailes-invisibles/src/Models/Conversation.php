<?php

namespace Modules\AilesInvisibles\Models;

use App\Concerns\HasTeam;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Conversation extends Model
{
    use HasTeam, SoftDeletes;

    protected $table = 'ai_conversations';

    protected $fillable = [
        'team_id',
        'title',
        'type',
        'created_by_type',
        'created_by_id',
        'last_message_at',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
            'archived_at' => 'datetime',
        ];
    }

    public function participants()
    {
        return $this->hasMany(ConversationParticipant::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class)->orderBy('created_at');
    }

    public function latestMessages()
    {
        return $this->hasMany(Message::class)->orderBy('created_at', 'desc');
    }

    public function scopeNotArchived($query)
    {
        $query->whereNull('archived_at');
    }

    public function scopeArchived($query)
    {
        $query->whereNotNull('archived_at');
    }

    public function scopeUnassigned($query)
    {
        $query->whereDoesntHave('participants', fn ($q) => $q->where('participant_type', User::class));
    }

    public function auditLogs()
    {
        return $this->hasMany(ConversationAuditLog::class)->orderBy('created_at', 'desc');
    }
}
