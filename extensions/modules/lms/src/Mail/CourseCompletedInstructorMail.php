<?php

namespace Modules\Lms\Mail;

use App\Mail\BaseMailable;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Modules\Lms\Models\Enrollment;

class CourseCompletedInstructorMail extends BaseMailable implements ShouldQueue
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
            'progress' => (string) $this->enrollment->progress,
            'analytics_url' => url("/{$teamSlug}/lms/courses/{$course->id}/analytics"),
        ];

        return $this->buildFromTemplate('lms', 'course-completed-instructor', $variables)
            ?? $this->subject(__('lms::emails.course_completed_instructor.subject', [
                'learner' => $learnerName,
                'course' => $course->title,
            ]))->view('lms::emails.course-completed-instructor', [
                'name' => $this->instructor->name,
                'learnerName' => $learnerName,
                'courseTitle' => $course->title,
                'progress' => $this->enrollment->progress,
                'analyticsUrl' => url("/{$teamSlug}/lms/courses/{$course->id}/analytics"),
            ]);
    }
}
