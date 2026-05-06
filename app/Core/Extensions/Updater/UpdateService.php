<?php

namespace App\Core\Extensions\Updater;

use App\Core\Extensions\ExtensionManager;
use App\Core\Extensions\Installer\ZipInstaller;
use App\Core\Extensions\Marketplace\MarketplaceClient;
use App\Core\Extensions\Marketplace\UpdateInfo;
use App\Models\Extension;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

final class UpdateService
{
    public function __construct(
        private readonly MarketplaceClient $marketplace,
        private readonly ZipInstaller $installer,
        private readonly ExtensionManager $manager,
    ) {}

    /**
     * Check all installed extensions for available updates.
     *
     * @return Collection<string, UpdateInfo>
     */
    public function checkForUpdates(): Collection
    {
        return $this->marketplace->checkUpdates();
    }

    /**
     * Update a single extension to its latest version.
     */
    public function update(string $identifier): bool
    {
        $extension = Extension::where('identifier', $identifier)->first();

        if (! $extension) {
            return false;
        }

        $raw = $extension->raw ?? [];
        $owner = $raw['marketplace_owner'] ?? null;
        $repo = $raw['marketplace_repo'] ?? null;

        if (! $owner || ! $repo) {
            Log::warning("Cannot update {$identifier}: no marketplace source configured.");

            return false;
        }

        try {
            // Download and install new version
            $manifest = $this->installer->installFromGithub($owner, $repo);

            // Re-sync to update DB record
            $this->manager->sync();

            Log::info("Extension {$identifier} updated to {$manifest->version}");

            return true;
        } catch (\Throwable $e) {
            Log::error("Failed to update extension {$identifier}: {$e->getMessage()}");

            return false;
        }
    }

    /**
     * Update all extensions that have available updates.
     *
     * @return list<string> Identifiers of successfully updated extensions
     */
    public function updateAll(): array
    {
        $updates = $this->checkForUpdates();
        $updated = [];

        foreach ($updates as $identifier => $updateInfo) {
            if ($this->update($identifier)) {
                $updated[] = $identifier;
            }
        }

        return $updated;
    }
}
