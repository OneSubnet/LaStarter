<?php

namespace App\Concerns;

use App\Models\TeamSetting;

trait ConfiguresTeamMailer
{
    protected function configureTeamMailer(int $teamId): void
    {
        $settings = TeamSetting::where('team_id', $teamId)
            ->whereIn('key', [
                'mail_host', 'mail_port', 'mail_username', 'mail_password',
                'mail_encryption', 'mail_from_address', 'mail_from_name',
            ])
            ->pluck('value', 'key');

        $host = $settings->get('mail_host');

        if (! $host) {
            return;
        }

        config([
            'mail.default' => 'team',
            'mail.mailers.team' => [
                'transport' => 'smtp',
                'host' => $host,
                'port' => (int) ($settings->get('mail_port') ?? 587),
                'username' => $settings->get('mail_username'),
                'password' => $settings->get('mail_password'),
                'encryption' => $settings->get('mail_encryption', 'tls'),
                'timeout' => 15,
            ],
            'mail.from.address' => $settings->get('mail_from_address', config('mail.from.address')),
            'mail.from.name' => $settings->get('mail_from_name', config('mail.from.name')),
        ]);
    }
}
