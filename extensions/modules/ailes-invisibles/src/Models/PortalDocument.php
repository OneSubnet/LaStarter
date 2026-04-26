<?php

namespace Modules\AilesInvisibles\Models;

use App\Concerns\HasTeam;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PortalDocument extends Model
{
    use HasTeam, SoftDeletes;

    protected $table = 'ai_portal_documents';

    protected $fillable = [
        'team_id',
        'client_id',
        'uploaded_by',
        'title',
        'file_path',
        'file_type',
        'file_size',
        'category',
        'status',
        'requires_signature',
        'instructions',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'requires_signature' => 'boolean',
            'expires_at' => 'datetime',
        ];
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function signatures()
    {
        return $this->hasMany(DocumentSignature::class, 'document_id');
    }

    public function isSigned(): bool
    {
        return $this->signatures()->exists();
    }
}
