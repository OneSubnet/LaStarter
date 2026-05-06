<?php

namespace App\Core\Settings;

use App\Core\Context\AppContext;
use App\Models\TeamSetting;
use Illuminate\Support\Facades\Cache;

final class SettingManager
{
    private function teamId(): ?int
    {
        try {
            $team = app(AppContext::class)->team();

            return $team?->id;
        } catch (\Throwable) {
            return null;
        }
    }

    private function cacheKey(int $teamId, string $key): string
    {
        return "settings.{$teamId}.{$key}";
    }

    public function get(string $key, mixed $default = null): mixed
    {
        $teamId = $this->teamId();

        if ($teamId === null) {
            return $default;
        }

        return Cache::remember(
            $this->cacheKey($teamId, $key),
            now()->addHour(),
            fn () => TeamSetting::where('team_id', $teamId)
                ->where('key', $key)
                ->value('value') ?? $default,
        );
    }

    public function set(string $key, mixed $value): void
    {
        $teamId = $this->teamId();

        if ($teamId === null) {
            return;
        }

        TeamSetting::updateOrCreate(
            ['team_id' => $teamId, 'key' => $key],
            ['value' => $value],
        );

        Cache::forget($this->cacheKey($teamId, $key));
    }

    public function forget(string $key): void
    {
        $teamId = $this->teamId();

        if ($teamId === null) {
            return;
        }

        TeamSetting::where('team_id', $teamId)->where('key', $key)->delete();
        Cache::forget($this->cacheKey($teamId, $key));
    }
}
