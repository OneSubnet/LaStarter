<?php

namespace Modules\Lms\Domain\Enrollment\Events;

use Modules\Lms\Models\Enrollment;

/**
 * Course Completed Event
 */
class CourseCompletedEvent
{
    public function __construct(
        public readonly Enrollment $enrollment,
    ) {}
}
