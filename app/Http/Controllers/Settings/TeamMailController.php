<?php

namespace App\Http\Controllers\Settings;

use App\Core\Settings\SettingManager;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateTeamMailRequest;
use App\Mail\TestMail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class TeamMailController extends Controller
{
    public function __construct(
        private SettingManager $settings,
    ) {}

    public function edit(Request $request): Response
    {
        Gate::authorize('update', $request->user()->currentTeam);

        return Inertia::render('settings/team-mail', [
            'mail' => [
                'host' => $this->settings->get('mail_host', ''),
                'port' => $this->settings->get('mail_port', '587'),
                'username' => $this->settings->get('mail_username', ''),
                'password' => $this->settings->get('mail_password') ? '••••••••' : '',
                'encryption' => $this->settings->get('mail_encryption', 'tls'),
                'from_address' => $this->settings->get('mail_from_address', ''),
                'from_name' => $this->settings->get('mail_from_name', ''),
            ],
        ]);
    }

    public function update(UpdateTeamMailRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        foreach ($validated as $key => $value) {
            if ($key === 'password' && ($value === '••••••••' || $value === '')) {
                continue;
            }

            $this->settings->set("mail_{$key}", $value);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Mail settings saved.')]);

        return back();
    }

    public function test(Request $request): RedirectResponse
    {
        Gate::authorize('update', $request->user()->currentTeam);

        $host = $this->settings->get('mail_host');

        if (! $host) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Configure mail settings before sending a test email.')]);

            return back();
        }

        try {
            $this->sendTestEmail($request);
            Inertia::flash('toast', ['type' => 'success', 'message' => __('Test email sent successfully.')]);
        } catch (\Throwable $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Failed to send test email: ').$e->getMessage()]);
        }

        return back();
    }

    protected function sendTestEmail(Request $request): void
    {
        $team = $request->user()->currentTeam;

        config([
            'mail.mailers.team' => [
                'transport' => 'smtp',
                'host' => $this->settings->get('mail_host'),
                'port' => (int) $this->settings->get('mail_port', 587),
                'username' => $this->settings->get('mail_username'),
                'password' => $this->settings->get('mail_password'),
                'encryption' => $this->settings->get('mail_encryption', 'tls'),
            ],
            'mail.from.address' => $this->settings->get('mail_from_address', config('mail.from.address')),
            'mail.from.name' => $this->settings->get('mail_from_name', config('mail.from.name')),
        ]);

        Mail::mailer('team')
            ->to($request->user()->email)
            ->send(new TestMail($team->name));
    }
}
