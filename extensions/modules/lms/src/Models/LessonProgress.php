<?php

namespace Modules\Lms\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class LessonProgress extends Model
{
    public const int COMPLETION_THRESHOLD = 1000;

    protected $table = 'lms_lesson_progress';

    protected $fillable = [
        'enrollment_id',
        'lesson_id',
        'status',
        'progress',
        'time_spent_seconds',
        'completed_at',
        'last_position',
        'is_bookmarked',
    ];

    protected $casts = [
        'progress' => 'integer',
        'time_spent_seconds' => 'integer',
        'completed_at' => 'datetime',
        'last_position' => 'integer',
        'is_bookmarked' => 'boolean',
    ];

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function isCompleted(): bool
    {
        return $this->progress >= self::COMPLETION_THRESHOLD;
    }

    public function percentage(): int
    {
        return intdiv($this->progress, 10);
    }
}
