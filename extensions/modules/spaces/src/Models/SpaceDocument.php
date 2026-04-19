<?php

namespace Modules\Spaces\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SpaceDocument extends Model
{
    use SoftDeletes;

    protected $table = 'space_documents';

    protected $fillable = [
        'space_id',
        'user_id',
        'name',
        'file_path',
        'file_type',
        'file_size',
        'status',
        'requires_signature',
        'instructions',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'requires_signature' => 'boolean',
            'file_size' => 'integer',
            'expires_at' => 'datetime',
        ];
    }

    public function space()
    {
        return $this->belongsTo(Space::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function assignments()
    {
        return $this->hasMany(SpaceDocumentAssignment::class, 'document_id');
    }

    public function signatures()
    {
        return $this->hasMany(SpaceDocumentSignature::class, 'document_id');
    }
}
