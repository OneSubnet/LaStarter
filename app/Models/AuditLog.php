<?php

namespace App\Models;

use App\Concerns\HasTeam;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['team_id', 'user_id', 'action', 'subject_type', 'subject_id', 'properties', 'ip_address', 'user_agent', 'trace_id', 'module'])]
class AuditLog extends Model
{
    use HasTeam;

    public $timestamps = false;

    protected $table = 'audit_logs';

    protected function casts(): array
    {
        return [
            'properties' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function subject()
    {
        return $this->morphTo();
    }

    public static function booted(): void
    {
        static::creating(function (AuditLog $log) {
            $log->created_at = $log->created_at ?? now();
        });
    }
}
