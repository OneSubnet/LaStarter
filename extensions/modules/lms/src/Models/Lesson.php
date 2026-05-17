<?php

namespace Modules\Lms\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

final class Lesson extends Model
{
    protected $table = 'lms_lessons';

    protected $fillable = [
        'section_id',
        'title',
        'slug',
        'content_type',
        'content',
        'video_url',
        'video_duration_seconds',
        'sort_order',
        'is_published',
    ];

    protected $casts = [
        'video_duration_seconds' => 'integer',
        'sort_order' => 'integer',
        'is_published' => 'boolean',
    ];

    protected static function booted(): void
    {
        self::creating(function (self $lesson) {
            if (empty($lesson->slug)) {
                $lesson->slug = Str::slug($lesson->title);
            }
        });
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(CourseSection::class, 'section_id');
    }

    public function progress(): HasMany
    {
        return $this->hasMany(LessonProgress::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(QuizQuestion::class);
    }

    public function isVideo(): bool
    {
        return $this->content_type === 'video';
    }
}
