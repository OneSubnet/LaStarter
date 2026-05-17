<?php

namespace App\Core\Mail;

use App\Concerns\ConfiguresTeamMailer;
use App\Models\User;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class MailSender
{
    use ConfiguresTeamMailer;

    private ?User $user = null;

    public static function to(User $user): self
    {
        $instance = new self;
        $instance->user = $user;

        return $instance;
    }

    public function send(Mailable $mailable): void
    {
        if (! $this->user) {
            return;
        }

        // Configure team SMTP if available
        $team = $this->user->currentTeam;
        if ($team) {
            $this->configureTeamMailer($team->id);
        }

        // Check mail is configured
        $defaultMailer = config('mail.default');
        if ($defaultMailer === 'log' || $defaultMailer === 'array') {
            Log::info('MailSender: mail not configured, skipping send.', [
                'user' => $this->user->email,
                'mailer' => $defaultMailer,
            ]);

            Mail::to($this->user)->send($mailable);

            return;
        }

        Mail::to($this->user)->send($mailable);
    }

    public function queue(Mailable $mailable): void
    {
        if (! $this->user) {
            return;
        }

        $team = $this->user->currentTeam;
        if ($team) {
            $this->configureTeamMailer($team->id);
        }

        Mail::to($this->user)->queue($mailable);
    }
}
