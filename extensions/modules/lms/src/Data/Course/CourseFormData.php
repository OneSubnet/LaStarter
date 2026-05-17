<?php

namespace Modules\Lms\Data\Course;

use Modules\Lms\Models\Course;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class CourseFormData extends Data
{
    public function __construct(
        public readonly ?int $id = null,
        public readonly string $title = '',
        public readonly ?string $description = null,
        public readonly ?string $thumbnail_path = null,
        public readonly string $status = 'draft',
        public readonly ?int $estimated_duration_minutes = null,
        public readonly bool $certificate_enabled = true,
        public readonly int $certificate_threshold = 80,
        public readonly ?string $certificate_teacher_name = null,
        public readonly ?string $certificate_teacher_role = null,
        public readonly ?array $settings = null,
    ) {}

    public static function fromModel(Course $course): self
    {
        return new self(
            id: $course->id,
            title: $course->title,
            description: $course->description,
            thumbnail_path: $course->thumbnail_path,
            status: $course->status,
            estimated_duration_minutes: $course->estimated_duration_minutes,
            certificate_enabled: $course->certificate_enabled ?? true,
            certificate_threshold: $course->certificate_threshold ?? 80,
            certificate_teacher_name: $course->certificate_teacher_name,
            certificate_teacher_role: $course->certificate_teacher_role,
            settings: $course->settings,
        );
    }
}
