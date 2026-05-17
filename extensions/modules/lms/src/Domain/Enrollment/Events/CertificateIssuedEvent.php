<?php

namespace Modules\Lms\Domain\Enrollment\Events;

use Modules\Lms\Models\Certificate;

/**
 * Certificate Issued Event
 */
class CertificateIssuedEvent
{
    public function __construct(
        public readonly Certificate $certificate,
    ) {}
}
