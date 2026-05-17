<?php

namespace Modules\Lms\Mail;

use App\Mail\BaseMailable;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Modules\Lms\Models\Enrollment;

class LearnerEnrolledMail extends BaseMailable implements ShouldQueue
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
            'course_url' => url("/{$teamSlug}/lms/learn/{$course->id}"),
        ];

        return $this->buildFromTemplate('lms', 'enrolled', $variables)
            ?? $this->subject(__('lms::emails.enrolled.subject', ['course' => $course->title]))
                ->view('lms::emails.enrolled', [
                    'name' => $this->recipient->name,
                    'courseTitle' => $course->title,
                    'courseUrl' => url("/{$teamSlug}/lms/learn/{$course->id}"),
                ]);
    }
}
