<?php

namespace Modules\AilesInvisibles\Notifications;

use App\Concerns\ConfiguresTeamMailer;
use App\Models\Team;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Modules\AilesInvisibles\Models\Client;

class ClientPortalInvitation extends Notification implements ShouldQueue
{
    use ConfiguresTeamMailer, Queueable;

    public function __construct(
        public Client $client,
        public Team $team,
        public string $accessToken,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $this->configureTeamMailer($this->team->id);

        $acceptLink = url("/portal/accept/{$this->accessToken}");

        return (new MailMessage)
            ->subject(__('emails.client_portal.subject', ['teamName' => $this->team->name]))
            ->markdown('emails.modules.client-portal-invitation', [
                'clientName' => $this->client->first_name,
                'teamName' => $this->team->name,
                'acceptLinkUrl' => $acceptLink,
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'client_id' => $this->client->id,
            'team_id' => $this->team->id,
        ];
    }
}
