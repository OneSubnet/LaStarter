<?php

namespace Modules\Lms\Data\Progress;

use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class ProgressData extends Data
{
    /**
     * @param  array<int, array{title: string, completed: int, total: int, progress: int}>  $sections
     */
    public function __construct(
        public readonly int $completed_lessons,
        public readonly int $total_lessons,
        public readonly int $progress_percentage,
        public readonly array $sections = [],
    ) {}
}
