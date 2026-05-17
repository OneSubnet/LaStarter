<?php

namespace App\Core\Mail;

readonly class RenderedTemplate
{
    public function __construct(
        public string $subject,
        public string $htmlContent,
    ) {}
}
