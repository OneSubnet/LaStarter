<?php

namespace Modules\Lms\Models;

use App\Concerns\HasTeam;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

final class Enrollment extends Model
{
    use HasTeam, SoftDeletes;

    protected $table = 'lms_enrollments';

    protected $fillable = [
        'team_id',
        'course_id',
        'user_id',
        'name',
        'email',
        'role',
        'status',
        'enrolled_at',
        'completed_at',
        'progress',
        'last_accessed_at',
    ];

    protected $casts = [
        'enrolled_at' => 'datetime',
        'completed_at' => 'datetime',
        'last_accessed_at' => 'datetime',
        'progress' => 'integer',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lessonProgress(): HasMany
    {
        return $this->hasMany(LessonProgress::class);
    }

    public function certificate(): HasOne
    {
        return $this->hasOne(Certificate::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(LessonNote::class);
    }

    public function quizResponses(): HasMany
    {
        return $this->hasMany(QuizResponse::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(LearningActivity::class);
    }

    public function learnerName(): string
    {
        return $this->user?->name ?? $this->name ?? '';
    }

    public function learnerEmail(): string
    {
        return $this->user?->email ?? $this->email ?? '';
    }

    public function isCompleted(): bool
    {
        return $this->progress >= 100;
    }

    public function isBlocked(): bool
    {
        return $this->status === 'blocked';
    }

    public function isActive(): bool
    {
        return $this->status !== 'blocked';
    }

    public function scopeActive($query)
    {
        return $query->where('status', '!=', 'blocked');
    }

    public function scopeBlocked($query)
    {
        return $query->where('status', 'blocked');
    }
}
