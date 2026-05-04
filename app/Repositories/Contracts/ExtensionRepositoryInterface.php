<?php

namespace App\Repositories\Contracts;

use App\Models\Extension;
use Illuminate\Database\Eloquent\Collection;

interface ExtensionRepositoryInterface extends RepositoryInterface
{
    public function findByIdentifier(string $identifier): ?Extension;

    public function getAllEnabled(): Collection;

    public function getAllModules(): Collection;

    public function getAllThemes(): Collection;

    public function getForTeam(int $teamId): Collection;

    public function findEnabledForTeam(int $teamId, string $identifier): ?Extension;
}
