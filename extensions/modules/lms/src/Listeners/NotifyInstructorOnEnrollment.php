<?php

namespace Modules\Lms\Listeners;

use App\Core\Mail\MailSender;
use App\Models\Notification;
use Modules\Lms\Mail\LearnerEnrolledMail;
use Modules\Lms\Mail\NewEnrollmentMail;

class NotifyInstructorOnEnrollment
{
    public function handle(object $event): void
    {
        $enrollment = $event->enrollment ?? null;
        if (! $enrollment) {
            return;
        }

        $course = $enrollment->course;
        $instructor = $course->creator;

        if ($instructor) {
            Notification::create([
                'team_id' => $course->team_id,
                'user_id' => $instructor->id,
                'type' => 'lms.enrollment',
                'title' => __('lms::notifications.learner_enrolled_title'),
                'body' => __('lms::notifications.learner_enrolled_body', [
                    'learner' => $enrollment->learnerName(),
                    'course' => $course->title,
                ]),
                'data' => [
                    'course_id' => $course->id,
                    'enrollment_id' => $enrollment->id,
                ],
            ]);

            MailSender::to($instructor)->queue(new NewEnrollmentMail($instructor, $enrollment));
        }

        // Send welcome email to learner
        if ($enrollment->user_id) {
            $learner = $enrollment->user;
            if ($learner) {
                MailSender::to($learner)->queue(new LearnerEnrolledMail($learner, $enrollment));
            }
        }
    }
}
