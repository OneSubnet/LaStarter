<?php

namespace Modules\Lms\Listeners;

use App\Models\Notification;

class NotifyOnNewComment
{
    public function handle(object $event): void
    {
        $comment = $event->comment ?? null;
        if (! $comment) {
            return;
        }

        $lesson = $comment->lesson;
        $course = $lesson->section->course;

        // Don't notify if commenting on own content
        $instructor = $course->creator;
        if (! $instructor || $instructor->id === $comment->user_id) {
            return;
        }

        Notification::create([
            'team_id' => $course->team_id,
            'user_id' => $instructor->id,
            'type' => 'lms.comment',
            'title' => __('lms::notifications.new_comment_title'),
            'body' => __('lms::notifications.new_comment_body', [
                'user' => $comment->user->name,
                'lesson' => $lesson->title,
            ]),
            'data' => [
                'course_id' => $course->id,
                'lesson_id' => $lesson->id,
                'comment_id' => $comment->id,
            ],
        ]);
    }
}
