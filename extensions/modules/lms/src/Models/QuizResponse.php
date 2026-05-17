<?php

namespace Modules\Lms\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class QuizResponse extends Model
{
    protected $table = 'lms_quiz_responses';

    protected $fillable = [
        'enrollment_id',
        'question_id',
        'answer_id',
        'is_correct',
        'attempted_at',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
        'attempted_at' => 'datetime',
    ];

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(QuizQuestion::class, 'question_id');
    }

    public function answer(): BelongsTo
    {
        return $this->belongsTo(QuizAnswer::class, 'answer_id');
    }
}
