<?php

namespace Modules\Lms\Data\Section;

use Modules\Lms\Models\CourseSection;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class SectionRequestData extends Data
{
    public function __construct(
        public readonly int $course_id,
        #[Required, Max(255)]
        public readonly string $title,
        #[Nullable]
        public readonly ?string $description = null,
        public readonly int $sort_order = 0,
        public readonly bool $is_published = false,
    ) {}

    public function toModel(CourseSection $section): CourseSection
    {
        $section->fill([
            'course_id' => $this->course_id,
            'title' => $this->title,
            'description' => $this->description,
            'sort_order' => $this->sort_order,
            'is_published' => $this->is_published,
        ]);

        return $section;
    }
}
