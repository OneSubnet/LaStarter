<?php

namespace Modules\Lms\Mail;

use App\Mail\BaseMailable;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Modules\Lms\Models\Certificate;

class CertificateIssuedMail extends BaseMailable implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly User $recipient,
        private readonly Certificate $certificate,
    ) {
        parent::__construct($recipient);
    }

    public function build(): self
    {
        $course = $this->certificate->enrollment?->course;
        $teamSlug = $this->certificate->enrollment?->team?->slug;
        $variables = [
            'name' => $this->recipient->name,
            'course' => $course?->title ?? '',
            'certificate_url' => url("/{$teamSlug}/lms/certificates/{$this->certificate->id}"),
        ];

        return $this->buildFromTemplate('lms', 'certificate-issued', $variables)
            ?? $this->subject(__('lms::emails.certificate_issued.subject', ['course' => $course?->title ?? '']))
                ->view('lms::emails.certificate-issued', [
                    'name' => $this->recipient->name,
                    'courseTitle' => $course?->title ?? '',
                    'certificateUrl' => url("/{$teamSlug}/lms/certificates/{$this->certificate->id}"),
                ]);
    }
}
