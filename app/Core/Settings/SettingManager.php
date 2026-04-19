<?php

namespace App\Core\Settings;

use App\Models\TeamSetting;
use Illuminate\Support\Facades\Auth;

class SettingManager
{
    /**
     * Get a setting value for the current team.
     */
    public function get(string $key, mixed $default = null): mixed
    {
        $teamId = $this->teamId();

        if (! $teamId) {
            return $default;
        }

        $setting = TeamSetting::where('team_id', $teamId)
            ->where('key', $key)
            ->first();

        return $setting?->value ?? $default;
    }

    /**
     * Set a setting value for the current team.
     */
    public function set(string $key, mixed $value): void
    {
        $teamId = $this->teamId();

        if (! $teamId) {
            return;
        }

        TeamSetting::updateOrCreate(
            ['team_id' => $teamId, 'key' => $key],
            ['value' => is_array($value) ? json_encode($value) : $value],
        );
    }

    /**
     * Remove a setting for the current team.
     */
    public function forget(string $key): void
    {
        $teamId = $this->teamId();

        if (! $teamId) {
            return;
        }

        TeamSetting::where('team_id', $teamId)
            ->where('key', $key)
            ->delete();
    }

    /**
     * Get all settings for the current team as key-value pairs.
     */
    public function all(): array
    {
        $teamId = $this->teamId();

        if (! $teamId) {
            return [];
        }

        return TeamSetting::where('team_id', $teamId)
            ->pluck('value', 'key')
            ->toArray();
    }

    /**
     * Get the current team ID.
     */
    protected function teamId(): ?int
    {
        return Auth::user()?->current_team_id;
    }
}
