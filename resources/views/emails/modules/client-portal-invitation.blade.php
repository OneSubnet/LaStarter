@include('emails.layout', [
    'headerTitle' => $teamName ?? config('app.name'),
    'body' =>
        '<h2 style="margin:0 0 16px; font-size:22px; font-weight:700; color:#111827;">' . __('emails.client_portal.title') . '</h2>' .
        '<p style="margin:0 0 12px;">' . __('emails.client_portal.greeting', ['name' => $clientName]) . '</p>' .
        '<p style="margin:0 0 12px;">' . __('emails.client_portal.body', ['teamName' => $teamName]) . '</p>' .
        '<p style="margin:0 0 12px; color:#6b7280; font-size:14px;">' . __('emails.client_portal.features') . '</p>',
    'buttonUrl' => $acceptLinkUrl,
    'buttonText' => __('emails.client_portal.accept_button'),
    'subtext' => __('emails.client_portal.set_password') . '<br>' . __('emails.client_portal.ignore'),
])
