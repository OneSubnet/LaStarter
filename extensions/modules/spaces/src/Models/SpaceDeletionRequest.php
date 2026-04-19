<?php

namespace Modules\Spaces\Models;

use App\Concerns\HasTeam;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class SpaceDeletionRequest extends Model
{
    use HasTeam;

    protected $table = 'space_deletion_requests';

    protected $fillable = [
        'team_id',
        'user_id',
        'reason',
        'status',
        'hold_until',
        'reviewed_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'hold_until' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
