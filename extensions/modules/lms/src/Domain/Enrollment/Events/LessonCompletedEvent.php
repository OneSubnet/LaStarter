<?php

namespace Modules\Lms\Domain\Enrollment\Events;

use Modules\Lms\Models\Lesson;
use Modules\Lms\Models\LessonProgress;

/**
 * Lesson Completed Event
 */
class LessonCompletedEvent
{
    public function __construct(
        public readonly LessonProgress $lessonProgress,
        public readonly Lesson $lesson,
    ) {}
}
