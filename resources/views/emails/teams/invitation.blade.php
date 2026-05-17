@include('emails.layout', [
    'headerTitle' => $teamName ?? config('app.name'),
    'body' =>
        '<h2 style="margin:0 0 16px; font-size:22px; font-weight:700; color:#111827;">' . __('emails.team_invitation.title') . '</h2>' .
        '<p style="margin:0 0 12px;">' . __('emails.team_invitation.greeting', ['name' => $name ?? '']) . '</p>' .
        '<p style="margin:0 0 12px;">' . __('emails.team_invitation.body', ['inviterName' => $inviterName, 'teamName' => $teamName]) . '</p>',
    'buttonUrl' => $acceptUrl,
    'buttonText' => __('emails.team_invitation.accept_button'),
    'subtext' => __('emails.team_invitation.no_action'),
])
