<?php

namespace App\Services;

use App\Models\TeamSetting;
use App\Services\Contracts\SettingServiceInterface;

class SettingService implements SettingServiceInterface
{
    public function get(string $key, mixed $default = null): mixed
    {
        $setting = TeamSetting::whereNull('team_id')
            ->where('key', $key)
            ->first();

        if (! $setting) {
            return $default;
        }

        return $this->castValue($setting->value, $setting->type);
    }

    public function set(string $key, mixed $value): void
    {
        $type = $this->getValueType($value);

        TeamSetting::updateOrCreate(
            ['key' => $key, 'team_id' => null],
            ['value' => $this->serializeValue($value), 'type' => $type]
        );
    }

    public function getForTeam(int $teamId, string $key, mixed $default = null): mixed
    {
        $setting = TeamSetting::where('team_id', $teamId)
            ->where('key', $key)
            ->first();

        if (! $setting) {
            return $default;
        }

        return $this->castValue($setting->value, $setting->type);
    }

    public function setForTeam(int $teamId, string $key, mixed $value): void
    {
        $type = $this->getValueType($value);

        TeamSetting::updateOrCreate(
            ['key' => $key, 'team_id' => $teamId],
            ['value' => $this->serializeValue($value), 'type' => $type]
        );
    }

    public function remove(string $key): void
    {
        TeamSetting::whereNull('team_id')
            ->where('key', $key)
            ->delete();
    }

    public function removeForTeam(int $teamId, string $key): void
    {
        TeamSetting::where('team_id', $teamId)
            ->where('key', $key)
            ->delete();
    }

    public function getAll(): array
    {
        return TeamSetting::whereNull('team_id')
            ->get()
            ->mapWithKeys(fn ($setting) => [
                $setting->key => $this->castValue($setting->value, $setting->type),
            ])
            ->toArray();
    }

    public function getAllForTeam(int $teamId): array
    {
        return TeamSetting::where('team_id', $teamId)
            ->get()
            ->mapWithKeys(fn ($setting) => [
                $setting->key => $this->castValue($setting->value, $setting->type),
            ])
            ->toArray();
    }

    private function castValue(mixed $value, string $type): mixed
    {
        return match ($type) {
            'boolean', 'bool' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'integer', 'int' => (int) $value,
            'number', 'float', 'double' => (float) $value,
            'array', 'json' => json_decode($value, true),
            default => $value,
        };
    }

    private function getValueType(mixed $value): string
    {
        return match (true) {
            is_bool($value) => 'boolean',
            is_int($value) => 'integer',
            is_float($value) => 'number',
            is_array($value) => 'array',
            default => 'string',
        };
    }

    private function serializeValue(mixed $value): string
    {
        return is_array($value) ? json_encode($value) : (string) $value;
    }
}
