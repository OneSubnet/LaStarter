<?php

namespace Modules\AilesInvisibles\Models;

use Illuminate\Database\Eloquent\Model;

class MessageReadReceipt extends Model
{
    protected $table = 'ai_message_read_receipts';

    protected $fillable = [
        'message_id',
        'reader_type',
        'reader_id',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function message()
    {
        return $this->belongsTo(Message::class);
    }
}
