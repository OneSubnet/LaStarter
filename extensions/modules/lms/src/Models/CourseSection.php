<?php

namespace Modules\Lms\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

final class CourseSection extends Model
{
    protected $table = 'lms_course_sections';

    protected $fillable = [
        'course_id',
        'title',
        'description',
        'sort_order',
        'is_published',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'is_published' => 'boolean',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class, 'section_id')->orderBy('sort_order');
    }

    public function quizQuestions(): MorphMany
    {
        return $this->morphMany(QuizQuestion::class, 'quizable')->orderBy('sort_order');
    }
}
