<?php

namespace Modules\Lms\Data\Course;

use Modules\Lms\Models\Course;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class CourseRowData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly string $title,
        public readonly ?string $description,
        public readonly string $status,
        public readonly int $sections_count,
        public readonly int $enrollments_count,
        public readonly ?int $estimated_duration_minutes,
        public readonly string $created_at,
    ) {}

    public static function fromModel(Course $course): self
    {
        return new self(
            id: $course->id,
            title: $course->title,
            description: $course->description,
            status: $course->status,
            sections_count: $course->sections_count ?? $course->relationLoaded('sections') ? $course->sections->count() : 0,
            enrollments_count: $course->enrollments_count ?? $course->relationLoaded('enrollments') ? $course->enrollments->count() : 0,
            estimated_duration_minutes: $course->estimated_duration_minutes,
            created_at: $course->created_at->toIso8601String(),
        );
    }
}
