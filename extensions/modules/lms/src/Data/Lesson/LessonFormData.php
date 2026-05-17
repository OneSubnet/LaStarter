<?php

namespace Modules\Lms\Data\Lesson;

use Modules\Lms\Models\Lesson;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class LessonFormData extends Data
{
    public function __construct(
        public readonly ?int $id = null,
        public readonly ?int $section_id = null,
        public readonly string $title = '',
        public readonly ?string $slug = null,
        public readonly string $content_type = 'text',
        public readonly ?string $content = null,
        public readonly ?string $video_url = null,
        public readonly ?int $video_duration_seconds = null,
        public readonly int $sort_order = 0,
        public readonly bool $is_published = false,
    ) {}

    public static function fromModel(Lesson $lesson): self
    {
        return new self(
            id: $lesson->id,
            section_id: $lesson->section_id,
            title: $lesson->title,
            slug: $lesson->slug,
            content_type: $lesson->content_type,
            content: $lesson->content,
            video_url: $lesson->video_url,
            video_duration_seconds: $lesson->video_duration_seconds,
            sort_order: $lesson->sort_order,
            is_published: $lesson->is_published,
        );
    }
}
