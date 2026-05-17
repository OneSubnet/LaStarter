<?php

namespace Modules\Lms\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class LearningActivity extends Model
{
    protected $table = 'lms_learning_activities';

    protected $fillable = [
        'enrollment_id',
        'lesson_id',
        'time_spent_seconds',
        'activity_date',
    ];

    protected $casts = [
        'activity_date' => 'date',
        'time_spent_seconds' => 'integer',
    ];

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
}
