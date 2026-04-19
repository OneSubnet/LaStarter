<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;

class TestMail extends Mailable
{
    public function __construct(
        private string $teamName,
    ) {}

    public function build(): self
    {
        return $this->subject("Test email from {$this->teamName}")
            ->markdown('emails.test', [
                'teamName' => $this->teamName,
            ]);
    }
}
