<?php

namespace Modules\Lms\Data\Lesson;

use Modules\Lms\Models\Lesson;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class LessonRequestData extends Data
{
    public function __construct(
        public readonly int $section_id,
        #[Required, Max(255)]
        public readonly string $title,
        public readonly string $content_type = 'text',
        #[Nullable]
        public readonly ?string $content = null,
        #[Nullable, Max(500)]
        public readonly ?string $video_url = null,
        #[Nullable]
        public readonly ?int $video_duration_seconds = null,
        public readonly int $sort_order = 0,
        public readonly bool $is_published = false,
    ) {}

    public function toModel(Lesson $lesson): Lesson
    {
        $lesson->fill([
            'section_id' => $this->section_id,
            'title' => $this->title,
            'content_type' => $this->content_type,
            'content' => $this->content,
            'video_url' => $this->video_url,
            'video_duration_seconds' => $this->video_duration_seconds,
            'sort_order' => $this->sort_order,
            'is_published' => $this->is_published,
        ]);

        return $lesson;
    }
}
