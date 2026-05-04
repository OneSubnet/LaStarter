<?php

namespace App\Services\Contracts;

interface SettingServiceInterface
{
    public function get(string $key, mixed $default = null): mixed;

    public function set(string $key, mixed $value): void;

    public function getForTeam(int $teamId, string $key, mixed $default = null): mixed;

    public function setForTeam(int $teamId, string $key, mixed $value): void;

    public function remove(string $key): void;

    public function removeForTeam(int $teamId, string $key): void;

    public function getAll(): array;

    public function getAllForTeam(int $teamId): array;
}
