<?php

namespace Modules\Lms\Listeners;

use App\Core\Mail\MailSender;
use App\Models\Notification;
use Modules\Lms\Mail\CourseCompletedInstructorMail;
use Modules\Lms\Mail\CourseCompletedMail;

class NotifyOnCourseCompleted
{
    public function handle(object $event): void
    {
        $enrollment = $event->enrollment ?? null;
        if (! $enrollment) {
            return;
        }

        $course = $enrollment->course;

        // Notify the instructor
        $instructor = $course->creator;
        if ($instructor) {
            Notification::create([
                'team_id' => $course->team_id,
                'user_id' => $instructor->id,
                'type' => 'lms.course_completed',
                'title' => __('lms::notifications.course_completed_title'),
                'body' => __('lms::notifications.course_completed_body', [
                    'learner' => $enrollment->learnerName(),
                    'course' => $course->title,
                ]),
                'data' => [
                    'course_id' => $course->id,
                    'enrollment_id' => $enrollment->id,
                ],
            ]);

            MailSender::to($instructor)->queue(new CourseCompletedInstructorMail($instructor, $enrollment));
        }

        // Notify the learner
        if ($enrollment->user_id) {
            Notification::create([
                'team_id' => $course->team_id,
                'user_id' => $enrollment->user_id,
                'type' => 'lms.course_completed',
                'title' => __('lms::notifications.course_completed_learner_title'),
                'body' => __('lms::notifications.course_completed_learner_body', [
                    'course' => $course->title,
                ]),
                'data' => [
                    'course_id' => $course->id,
                ],
            ]);

            $learner = $enrollment->user;
            if ($learner) {
                MailSender::to($learner)->queue(new CourseCompletedMail($learner, $enrollment));
            }
        }
    }
}
