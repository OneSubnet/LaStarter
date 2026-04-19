<?php

namespace App\Actions\Invitations;

use App\Models\Team;
use App\Notifications\Teams\TeamInvitation as TeamInvitationNotification;
use Illuminate\Support\Facades\Notification;

class CreateTeamInvitation
{
    public function handle(Team $team, string $email, string $role, int $invitedBy): void
    {
        $invitation = $team->invitations()->create([
            'email' => $email,
            'role' => $role,
            'invited_by' => $invitedBy,
            'expires_at' => now()->addDays(3),
        ]);

        Notification::route('mail', $invitation->email)
            ->notify(new TeamInvitationNotification($invitation));
    }
}
