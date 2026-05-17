<?php

namespace App\Mail;

use App\Models\User;

class TestMail extends BaseMailable
{
    public function __construct(
        private readonly string $teamName,
        ?User $recipient = null,
    ) {
        parent::__construct($recipient);
    }

    public function build(): self
    {
        return $this->subject(__('emails.test.subject', ['teamName' => $this->teamName]))
            ->markdown('emails.test', [
                'teamName' => $this->teamName,
            ]);
    }
}
