<?php

namespace Modules\AilesInvisibles\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentSignature extends Model
{
    protected $table = 'ai_document_signatures';

    protected $fillable = [
        'document_id',
        'signer_type',
        'signer_id',
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
        return $this->belongsTo(PortalDocument::class, 'document_id');
    }
}
