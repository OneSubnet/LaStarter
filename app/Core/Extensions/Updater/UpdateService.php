<?php

namespace App\Core\Extensions\Updater;

use App\Core\Extensions\ExtensionManager;
use App\Core\Extensions\Installer\ZipInstaller;
use App\Core\Extensions\Marketplace\MarketplaceClient;
use App\Core\Extensions\Marketplace\UpdateInfo;
use App\Core\Extensions\Updater\Events\ExtensionUpdateBlocked;
use App\Core\Extensions\Updater\Events\ExtensionUpdateCompleted;
use App\Core\System\CompatibilityChecker;
use App\Core\System\CompatibilityReport;
use App\Models\Extension;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;

final class UpdateService
{
    public function __construct(
        private readonly MarketplaceClient $marketplace,
        private readonly ZipInstaller $installer,
        private readonly ExtensionManager $manager,
        private readonly CompatibilityChecker $compatibility,
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
        $report = $this->updateWithReport($identifier);

        return $report->compatible;
    }

    /**
     * Update an extension and return a detailed compatibility report.
     */
    public function updateWithReport(string $identifier): CompatibilityReport
    {
        $extension = Extension::where('identifier', $identifier)->first();

        if (! $extension) {
            return CompatibilityReport::error("Extension '{$identifier}' not found.");
        }

        $raw = $extension->raw ?? [];
        $owner = $raw['marketplace_owner'] ?? null;
        $repo = $raw['marketplace_repo'] ?? null;

        if (! $owner || ! $repo) {
            $report = CompatibilityReport::error("No marketplace source configured for '{$identifier}'.");

            Event::dispatch(new ExtensionUpdateBlocked($identifier, $report));

            return $report;
        }

        try {
            // Download to temp location and read manifest
            $manifest = $this->installer->installFromGithub($owner, $repo);
        } catch (\Throwable $e) {
            $report = CompatibilityReport::error("Download failed: {$e->getMessage()}");

            Event::dispatch(new ExtensionUpdateBlocked($identifier, $report));

            return $report;
        }

        // Check compatibility with core version
        $coreReport = $this->compatibility->canUpdateExtension($manifest);

        if (! $coreReport->compatible) {
            Event::dispatch(new ExtensionUpdateBlocked($identifier, $coreReport));

            return $coreReport;
        }

        // Validate manifest evolution (API contract)
        $oldManifest = $this->manager->manifest($identifier);

        if ($oldManifest !== null) {
            $evolutionReport = $this->compatibility->validateManifestEvolution($oldManifest, $manifest);

            if (! $evolutionReport->compatible) {
                Event::dispatch(new ExtensionUpdateBlocked($identifier, $evolutionReport));

                return $evolutionReport;
            }
        }

        // Re-sync to update DB record
        $this->manager->sync();

        Log::info("Extension {$identifier} updated to {$manifest->version}");

        Event::dispatch(new ExtensionUpdateCompleted(
            $identifier,
            $extension->version ?? '0.0.0',
            $manifest->version ?? 'unknown',
        ));

        return CompatibilityReport::ok();
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
