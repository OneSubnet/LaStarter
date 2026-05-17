<?php

namespace Modules\Lms\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

final class QuizQuestion extends Model
{
    protected $table = 'lms_quiz_questions';

    protected $fillable = [
        'lesson_id',
        'quizable_type',
        'quizable_id',
        'question_text',
        'explanation',
        'sort_order',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    public function quizable(): MorphTo
    {
        return $this->morphTo();
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(QuizAnswer::class, 'question_id')->orderBy('sort_order');
    }
}
