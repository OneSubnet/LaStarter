<?php

namespace Modules\Lms\Data\Course;

use Modules\Lms\Models\Course;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class CourseRequestData extends Data
{
    public function __construct(
        #[Required, Max(255)]
        public readonly string $title,
        #[Nullable]
        public readonly ?string $description = null,
        #[Nullable, Max(255)]
        public readonly ?string $thumbnail_path = null,
        #[In('draft', 'published', 'archived')]
        public readonly string $status = 'draft',
        #[Nullable]
        public readonly ?int $estimated_duration_minutes = null,
        public readonly ?bool $certificate_enabled = null,
        #[Nullable]
        public readonly ?int $certificate_threshold = null,
        #[Nullable, Max(255)]
        public readonly ?string $certificate_teacher_name = null,
        #[Nullable, Max(255)]
        public readonly ?string $certificate_teacher_role = null,
        #[Nullable]
        public readonly ?bool $settings_enable_comments = null,
        #[Nullable]
        public readonly ?bool $settings_enable_notes = null,
        #[Nullable]
        public readonly ?bool $settings_enable_bookmarks = null,
        #[Nullable]
        public readonly ?bool $settings_enable_certificate = null,
        #[Nullable]
        public readonly ?bool $settings_auto_block_on_completion = null,
    ) {}

    public function toModel(Course $course): Course
    {
        $course->fill([
            'title' => $this->title,
            'description' => $this->description,
            'thumbnail_path' => $this->thumbnail_path,
            'status' => $this->status,
            'estimated_duration_minutes' => $this->estimated_duration_minutes,
            'certificate_enabled' => $this->certificate_enabled ?? $course->certificate_enabled,
            'certificate_threshold' => $this->certificate_threshold ?? $course->certificate_threshold,
            'certificate_teacher_name' => $this->certificate_teacher_name,
            'certificate_teacher_role' => $this->certificate_teacher_role,
            'settings' => [
                ...($course->settings ?? []),
                'enable_comments' => $this->settings_enable_comments ?? $course->settings['enable_comments'] ?? true,
                'enable_notes' => $this->settings_enable_notes ?? $course->settings['enable_notes'] ?? true,
                'enable_bookmarks' => $this->settings_enable_bookmarks ?? $course->settings['enable_bookmarks'] ?? true,
                'enable_certificate' => $this->settings_enable_certificate ?? $course->settings['enable_certificate'] ?? true,
                'auto_block_on_completion' => $this->settings_auto_block_on_completion ?? $course->settings['auto_block_on_completion'] ?? false,
            ],
        ]);

        return $course;
    }
}
