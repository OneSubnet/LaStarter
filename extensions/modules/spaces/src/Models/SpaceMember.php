<?php

namespace Modules\Spaces\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class SpaceMember extends Model
{
    public const ROLE_ADMIN = 'admin';
    public const ROLE_MEMBER = 'member';
    public const ROLE_VIEWER = 'viewer';

    protected $table = 'space_members';

    protected $fillable = [
        'space_id',
        'user_id',
        'role',
        'permissions',
        'joined_at',
    ];

    protected function casts(): array
    {
        return [
            'permissions' => 'array',
            'joined_at' => 'datetime',
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
