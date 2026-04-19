<?php

namespace Modules\Spaces\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class SpaceDocumentSignature extends Model
{
    protected $table = 'space_document_signatures';

    protected $fillable = [
        'document_id',
        'user_id',
        'signature_data',
        'ip_address',
        'user_agent',
        'signed_at',
    ];

    protected function casts(): array
    {
        return [
            'signed_at' => 'datetime',
        ];
    }

    public function document()
    {
        return $this->belongsTo(SpaceDocument::class, 'document_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
