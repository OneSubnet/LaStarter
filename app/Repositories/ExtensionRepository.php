<?php

namespace App\Repositories;

use App\Models\Extension;
use App\Repositories\Contracts\ExtensionRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class ExtensionRepository extends AbstractRepository implements ExtensionRepositoryInterface
{
    public function __construct(Extension $model)
    {
        $this->model = $model;
    }

    public function findByIdentifier(string $identifier): ?Extension
    {
        return $this->model->where('identifier', $identifier)->first();
    }

    public function getAllEnabled(): Collection
    {
        return $this->model->where('is_enabled', true)->get();
    }

    public function getAllModules(): Collection
    {
        return $this->model->where('type', 'module')->get();
    }

    public function getAllThemes(): Collection
    {
        return $this->model->where('type', 'theme')->get();
    }

    public function getForTeam(int $teamId): Collection
    {
        return $this->model->whereHas('teamExtensions', function ($query) use ($teamId) {
            $query->where('team_id', $teamId);
        })->get();
    }

    public function findEnabledForTeam(int $teamId, string $identifier): ?Extension
    {
        return $this->model
            ->where('identifier', $identifier)
            ->where('is_enabled', true)
            ->whereHas('teamExtensions', function ($query) use ($teamId) {
                $query->where('team_id', $teamId);
            })
            ->first();
    }
}
