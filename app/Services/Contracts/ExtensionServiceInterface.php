<?php

namespace App\Services\Contracts;

use App\Models\Extension;
use App\Models\Team;
use Illuminate\Database\Eloquent\Collection;

interface ExtensionServiceInterface
{
    public function getAll(): Collection;

    public function getAllEnabled(): Collection;

    public function getAllModules(): Collection;

    public function getAllThemes(): Collection;

    public function findByIdentifier(string $identifier): ?Extension;

    public function enable(Extension $extension, ?Team $team = null): void;

    public function disable(Extension $extension, ?Team $team = null): void;

    public function syncAll(): void;

    public function syncSingle(string $identifier): void;
}
