<?php

namespace Modules\AilesInvisibles\Models;

use Illuminate\Database\Eloquent\Model;

class MessageEncryptedKey extends Model
{
    protected $table = 'ai_message_encrypted_keys';

    protected $fillable = [
        'message_id',
        'participant_type',
        'participant_id',
        'encrypted_key',
    ];

    public function message()
    {
        return $this->belongsTo(Message::class);
    }
}
