<?php

namespace Modules\Lms\Data\Course;

use Modules\Lms\Models\Course;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class CourseContentData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly string $title,
        public readonly ?string $description,
        public readonly string $status,
        public readonly ?int $estimated_duration_minutes,
        /** @var array<int, array{id: int, title: string, description: ?string, sort_order: int, is_published: bool, lessons: array<int, array{id: int, section_id: ?int, title: string, slug: ?string, content_type: string, content: ?string, video_url: ?string, video_duration_seconds: ?int, sort_order: int, is_published: bool}>}> */
        public readonly array $sections = [],
    ) {}

    public static function fromModel(Course $course): self
    {
        return new self(
            id: $course->id,
            title: $course->title,
            description: $course->description,
            status: $course->status,
            estimated_duration_minutes: $course->estimated_duration_minutes,
            sections: $course->sections->map(fn ($section) => [
                'id' => $section->id,
                'title' => $section->title,
                'description' => $section->description,
                'sort_order' => $section->sort_order,
                'is_published' => $section->is_published,
                'lessons' => $section->lessons->map(fn ($lesson) => [
                    'id' => $lesson->id,
                    'section_id' => $lesson->section_id,
                    'title' => $lesson->title,
                    'slug' => $lesson->slug,
                    'content_type' => $lesson->content_type,
                    'content' => $lesson->content,
                    'video_url' => $lesson->video_url,
                    'video_duration_seconds' => $lesson->video_duration_seconds,
                    'sort_order' => $lesson->sort_order,
                    'is_published' => $lesson->is_published,
                ])->values()->all(),
            ])->values()->all(),
        );
    }
}
