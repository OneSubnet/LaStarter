<?php

namespace Modules\Spaces\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class SpaceDocumentAssignment extends Model
{
    protected $table = 'space_document_assignments';

    protected $fillable = [
        'document_id',
        'user_id',
        'action',
        'status',
        'completed_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'completed_at' => 'datetime',
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
