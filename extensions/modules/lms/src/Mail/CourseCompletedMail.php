<?php

namespace Modules\Lms\Mail;

use App\Mail\BaseMailable;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Modules\Lms\Models\Enrollment;

class CourseCompletedMail extends BaseMailable implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly User $recipient,
        private readonly Enrollment $enrollment,
    ) {
        parent::__construct($recipient);
    }

    public function build(): self
    {
        $course = $this->enrollment->course;
        $teamSlug = $this->enrollment->team?->slug ?? $course->team?->slug;
        $variables = [
            'name' => $this->recipient->name,
            'course' => $course->title,
            'progress' => (string) $this->enrollment->progress,
            'certificate_url' => url("/{$teamSlug}/lms/courses/{$course->id}"),
        ];

        return $this->buildFromTemplate('lms', 'course-completed', $variables)
            ?? $this->subject(__('lms::emails.course_completed.subject', ['course' => $course->title]))
                ->view('lms::emails.course-completed', [
                    'name' => $this->recipient->name,
                    'courseTitle' => $course->title,
                    'progress' => $this->enrollment->progress,
                    'certificateUrl' => url("/{$teamSlug}/lms/courses/{$course->id}"),
                ]);
    }
}
