<?php

namespace App\Services;

use App\Core\Extensions\ExtensionManager;
use App\Models\Extension;
use App\Models\Team;
use App\Repositories\Contracts\ExtensionRepositoryInterface;
use App\Services\Contracts\ExtensionServiceInterface;
use Illuminate\Database\Eloquent\Collection;

class ExtensionService implements ExtensionServiceInterface
{
    public function __construct(
        private ExtensionRepositoryInterface $extensionRepository,
        private ExtensionManager $extensionManager,
    ) {}

    public function getAll(): Collection
    {
        return $this->extensionRepository->all();
    }

    public function getAllEnabled(): Collection
    {
        return $this->extensionRepository->getAllEnabled();
    }

    public function getAllModules(): Collection
    {
        return $this->extensionRepository->getAllModules();
    }

    public function getAllThemes(): Collection
    {
        return $this->extensionRepository->getAllThemes();
    }

    public function findByIdentifier(string $identifier): ?Extension
    {
        return $this->extensionRepository->findByIdentifier($identifier);
    }

    public function enable(Extension $extension, ?Team $team = null): void
    {
        $this->extensionRepository->transaction(function () use ($extension, $team) {
            if ($team) {
                $team->extensions()->syncWithoutDetaching([
                    $extension->id => ['is_enabled' => true],
                ]);
            } else {
                $extension->update(['is_enabled' => true]);
            }

            $this->extensionManager->enable($extension->identifier, $team?->id);
        });
    }

    public function disable(Extension $extension, ?Team $team = null): void
    {
        $this->extensionRepository->transaction(function () use ($extension, $team) {
            if ($team) {
                $team->extensions()->updateExistingPivot($extension->id, ['is_enabled' => false]);
            } else {
                $extension->update(['is_enabled' => false]);
            }

            $this->extensionManager->disable($extension->identifier, $team?->id);
        });
    }

    public function syncAll(): void
    {
        $this->extensionManager->sync();
    }

    public function syncSingle(string $identifier): void
    {
        $this->extensionManager->syncSingle($identifier);
    }
}
