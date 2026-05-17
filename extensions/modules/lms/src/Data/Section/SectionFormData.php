<?php

namespace Modules\Lms\Data\Section;

use Modules\Lms\Models\CourseSection;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class SectionFormData extends Data
{
    public function __construct(
        public readonly ?int $id = null,
        public readonly int $course_id = 0,
        public readonly string $title = '',
        public readonly ?string $description = null,
        public readonly int $sort_order = 0,
        public readonly bool $is_published = false,
    ) {}

    public static function fromModel(CourseSection $section): self
    {
        return new self(
            id: $section->id,
            course_id: $section->course_id,
            title: $section->title,
            description: $section->description,
            sort_order: $section->sort_order,
            is_published: $section->is_published,
        );
    }
}
