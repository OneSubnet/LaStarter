<?php

namespace Modules\Lms\Domain\Enrollment\Events;

use Modules\Lms\Models\Enrollment;

/**
 * Learner Enrolled Event
 */
class LearnerEnrolledEvent
{
    public function __construct(
        public readonly Enrollment $enrollment,
    ) {}
}
