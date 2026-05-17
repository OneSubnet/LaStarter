<?php

namespace Modules\Lms\Domain\Course\Events;

use Modules\Lms\Models\LessonComment;

/**
 * Comment Created Event
 */
class CommentCreatedEvent
{
    public function __construct(
        public readonly LessonComment $comment,
    ) {}
}
