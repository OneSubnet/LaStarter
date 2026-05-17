<?php

namespace Modules\Lms\Mail;

use App\Mail\BaseMailable;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;

class PasswordSetupMail extends BaseMailable implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly User $recipient,
        private readonly string $resetUrl,
        private readonly string $teamName,
    ) {
        parent::__construct($recipient);
    }

    public function build(): self
    {
        $variables = [
            'name' => $this->recipient->name,
            'team' => $this->teamName,
            'reset_url' => $this->resetUrl,
        ];

        return $this->buildFromTemplate('lms', 'password-setup', $variables)
            ?? $this->subject(__('lms::emails.password_setup.subject', ['team' => $this->teamName]))
                ->view('lms::emails.password-setup', [
                    'name' => $this->recipient->name,
                    'teamName' => $this->teamName,
                    'resetUrl' => $this->resetUrl,
                ]);
    }
}
