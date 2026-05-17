<?php

namespace Modules\Lms\Domain\Enrollment\Services;

use Modules\Lms\Domain\Enrollment\Events\CertificateIssuedEvent;
use Modules\Lms\Models\Certificate;
use Modules\Lms\Models\Enrollment;

/**
 * Certificate Service
 *
 * Handles certificate generation and issuance.
 */
class CertificateService
{
    /**
     * Issue a certificate for a completed enrollment.
     */
    public function issueCertificate(Enrollment $enrollment): Certificate
    {
        $certificateNumber = $this->generateCertificateNumber();

        $certificate = new Certificate;
        $certificate->fill([
            'enrollment_id' => $enrollment->id,
            'certificate_number' => $certificateNumber,
            'issued_at' => now(),
        ]);
        $certificate->save();

        event(new CertificateIssuedEvent($certificate));

        return $certificate;
    }

    /**
     * Generate a unique certificate number.
     */
    protected function generateCertificateNumber(): string
    {
        $prefix = 'LMS';
        $timestamp = now()->format('Ymd');
        $random = strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));

        return sprintf('%s-%s-%s', $prefix, $timestamp, $random);
    }
}
