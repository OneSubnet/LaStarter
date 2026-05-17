<?php

namespace Modules\Lms\Mail;

use App\Mail\BaseMailable;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Modules\Lms\Models\Enrollment;

class NewEnrollmentMail extends BaseMailable implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly User $instructor,
        private readonly Enrollment $enrollment,
    ) {
        parent::__construct($instructor);
    }

    public function build(): self
    {
        $course = $this->enrollment->course;
        $teamSlug = $this->enrollment->team?->slug ?? $course->team?->slug;
        $learnerName = $this->enrollment->user?->name ?? $this->enrollment->name ?? '';
        $variables = [
            'name' => $this->instructor->name,
            'learner' => $learnerName,
            'course' => $course->title,
            'course_url' => url("/{$teamSlug}/lms/courses/{$course->id}"),
        ];

        return $this->buildFromTemplate('lms', 'new-enrollment', $variables)
            ?? $this->subject(__('lms::emails.new_enrollment.subject', ['course' => $course->title]))
                ->view('lms::emails.new-enrollment', [
                    'name' => $this->instructor->name,
                    'learnerName' => $learnerName,
                    'courseTitle' => $course->title,
                    'courseUrl' => url("/{$teamSlug}/lms/courses/{$course->id}"),
                ]);
    }
}
