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
        return $this->subject(__('emails.test.subject', ['teamName' => $this->teamName]))
            ->markdown('emails.test', [
                'teamName' => $this->teamName,
            ]);
    }
}
