<?php

namespace Modules\Lms\Models;

use App\Concerns\HasTeam;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

final class Course extends Model
{
    use HasTeam, SoftDeletes;

    protected $table = 'lms_courses';

    protected $fillable = [
        'team_id',
        'created_by',
        'title',
        'slug',
        'description',
        'thumbnail_path',
        'status',
        'estimated_duration_minutes',
        'settings',
        'certificate_enabled',
        'certificate_threshold',
        'certificate_teacher_name',
        'certificate_teacher_role',
    ];

    protected $casts = [
        'settings' => 'array',
        'estimated_duration_minutes' => 'integer',
        'certificate_enabled' => 'boolean',
        'certificate_threshold' => 'integer',
    ];

    protected static function booted(): void
    {
        self::creating(function (self $course) {
            if (empty($course->slug)) {
                $slug = Str::slug($course->title);
                $count = static::where('slug', $slug)->where('team_id', $course->team_id)->count();
                $course->slug = $count > 0 ? "{$slug}-{$count}" : $slug;
            }
        });
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function sections(): HasMany
    {
        return $this->hasMany(CourseSection::class)->orderBy('sort_order');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function isPublished(): bool
    {
        return $this->status === 'published';
    }

    public function quizQuestions(): MorphMany
    {
        return $this->morphMany(QuizQuestion::class, 'quizable')->orderBy('sort_order');
    }
}
