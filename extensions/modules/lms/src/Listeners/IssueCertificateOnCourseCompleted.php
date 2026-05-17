<?php

namespace Modules\Lms\Listeners;

use Modules\Lms\Domain\Enrollment\Events\CourseCompletedEvent;
use Modules\Lms\Domain\Enrollment\Services\CertificateService;

class IssueCertificateOnCourseCompleted
{
    public function __construct(
        private readonly CertificateService $certificateService,
    ) {}

    public function handle(CourseCompletedEvent $event): void
    {
        $enrollment = $event->enrollment;
        $course = $enrollment->course;

        $settings = is_array($course->settings) ? $course->settings : [];
        $certificateEnabled = $settings['enable_certificate'] ?? $course->certificate_enabled ?? true;

        if (! $certificateEnabled) {
            return;
        }

        if ($enrollment->certificate) {
            return;
        }

        $this->certificateService->issueCertificate($enrollment);
    }
}
