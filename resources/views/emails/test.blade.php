@include('emails.layout', [
    'headerTitle' => config('app.name'),
    'body' =>
        '<h2 style="margin:0 0 16px; font-size:22px; font-weight:700; color:#111827;">' . __('emails.test.title') . '</h2>' .
        '<p style="margin:0 0 12px;">' . __('emails.test.body', ['teamName' => $teamName]) . '</p>',
    'panelContent' => __('emails.test.success_message'),
    'buttonUrl' => url('/'),
    'buttonText' => __('emails.test.visit_dashboard', ['teamName' => $teamName]),
    'footerText' => __('emails.test.footer'),
])
