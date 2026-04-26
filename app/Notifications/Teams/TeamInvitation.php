<?php

namespace App\Notifications\Teams;

use App\Concerns\ConfiguresTeamMailer;
use App\Models\TeamInvitation as TeamInvitationModel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TeamInvitation extends Notification implements ShouldQueue
{
    use ConfiguresTeamMailer, Queueable;

    public function __construct(public TeamInvitationModel $invitation)
    {
        //
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $team = $this->invitation->team;

        $this->configureTeamMailer($team->id);

        return (new MailMessage)
            ->subject(__('emails.team_invitation.subject', ['teamName' => $team->name]))
            ->markdown('emails.teams.invitation', [
                'name' => $notifiable->name ?? $this->invitation->email,
                'inviterName' => $this->invitation->inviter->name,
                'teamName' => $team->name,
                'acceptUrl' => url("/invitations/{$this->invitation->code}"),
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'invitation_id' => $this->invitation->id,
            'team_id' => $this->invitation->team_id,
            'team_name' => $this->invitation->team->name,
            'role' => $this->invitation->role,
        ];
    }
}
