<?php

namespace Modules\Spaces\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class SpaceActivityLog extends Model
{
    protected $table = 'space_activity_log';

    protected $fillable = [
        'space_id',
        'user_id',
        'action',
        'subject_type',
        'subject_id',
        'properties',
    ];

    protected function casts(): array
    {
        return [
            'properties' => 'array',
        ];
    }

    public function space()
    {
        return $this->belongsTo(Space::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
