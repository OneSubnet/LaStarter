<?php

namespace Modules\AilesInvisibles\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Message extends Model
{
    use SoftDeletes;

    protected $table = 'ai_messages';

    protected $fillable = [
        'conversation_id',
        'sender_type',
        'sender_id',
        'encrypted_content',
        'iv',
        'type',
        'file_path',
        'file_name',
        'file_size',
        'edited_at',
    ];

    protected function casts(): array
    {
        return [
            'edited_at' => 'datetime',
        ];
    }

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function encryptedKeys()
    {
        return $this->hasMany(MessageEncryptedKey::class);
    }

    public function readReceipts()
    {
        return $this->hasMany(MessageReadReceipt::class);
    }

    public function hasFile(): bool
    {
        return ! empty($this->file_path);
    }
}
