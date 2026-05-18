<?php

namespace App\Models;

use App\Concerns\HasTeam;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'team_id', 'layout', 'widgets', 'is_default'])]
class DashboardLayout extends Model
{
    use HasTeam;

    protected function casts(): array
    {
        return [
            'layout' => 'array',
            'widgets' => 'array',
            'is_default' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeForUser($query, int $userId): void
    {
        $query->where('user_id', $userId);
    }

    public function scopeDefault($query): void
    {
        $query->where('is_default', true);
    }
}
