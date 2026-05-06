<?php

namespace App\Core\System;

use App\Core\Extensions\ExtensionManager;
use App\Core\Extensions\ExtensionManifest;
use App\Models\Extension;

final class CompatibilityChecker
{
    public function __construct(
        private readonly ExtensionManager $extensions,
    ) {}

    /**
     * Check that an extension update is compatible with the current core version.
     */
    public function canUpdateExtension(ExtensionManifest $newManifest): CompatibilityReport
    {
        $report = CompatibilityReport::ok();

        if ($newManifest->minimumCoreVersion !== null) {
            $coreVersion = config('lastarter.version', '1.0.0');

            if (version_compare($coreVersion, $newManifest->minimumCoreVersion, '<')) {
                $report = $report->withError(
                    "Extension requires core v{$newManifest->minimumCoreVersion}, current is v{$coreVersion}. Update the platform first."
                );
            }
        }

        return $report;
    }

    /**
     * Check that a core update is compatible with all installed extensions.
     */
    public function canUpdateCore(string $targetCoreVersion): CompatibilityReport
    {
        $report = CompatibilityReport::ok();
        $extensions = Extension::whereNotNull('state')->get();

        foreach ($extensions as $extension) {
            $manifest = $this->extensions->manifest($extension->identifier);

            if ($manifest === null) {
                continue;
            }

            if ($manifest->minimumCoreVersion !== null
                && version_compare($manifest->minimumCoreVersion, $targetCoreVersion, '>')) {
                $report = $report->withError(
                    "Extension '{$extension->identifier}' requires core v{$manifest->minimumCoreVersion}, but target is v{$targetCoreVersion}."
                );
            }

            if (! $manifest->hasProvider()) {
                $report = $report->withWarning(
                    "Extension '{$extension->identifier}' has no service provider — compatibility cannot be fully verified."
                );
            }
        }

        return $report;
    }

    /**
     * Validate that a new manifest does not remove any APIs or permissions.
     *
     * Contract: `provides` and `permissions` can only grow, never shrink.
     */
    public function validateManifestEvolution(ExtensionManifest $old, ExtensionManifest $new): CompatibilityReport
    {
        $report = CompatibilityReport::ok();

        if ($old->version !== null && $new->version !== null) {
            if (version_compare($new->version, $old->version, '<=')) {
                $report = $report->withError(
                    "New version ({$new->version}) must be greater than current ({$old->version})."
                );
            }
        }

        $removedProvides = array_diff($old->provides, $new->provides);
        if ($removedProvides !== []) {
            foreach ($removedProvides as $removed) {
                $report = $report->withError(
                    "API contract '{$removed}' was removed from 'provides'. Adding is allowed, removal breaks consumers."
                );
            }
        }

        $removedPermissions = array_diff($old->permissions, $new->permissions);
        if ($removedPermissions !== []) {
            foreach ($removedPermissions as $removed) {
                $report = $report->withError(
                    "Permission '{$removed}' was removed. Adding is allowed, removal breaks existing role assignments."
                );
            }
        }

        $addedDeps = array_diff($new->dependencies, $old->dependencies);
        if ($addedDeps !== []) {
            $report = $report->withWarning(
                'New dependencies added: '.implode(', ', $addedDeps).'. Ensure they are installed.'
            );
        }

        if ($new->minimumCoreVersion !== null && $old->minimumCoreVersion !== null) {
            if (version_compare($new->minimumCoreVersion, $old->minimumCoreVersion, '>')) {
                $coreVersion = config('lastarter.version', '1.0.0');
                if (version_compare($coreVersion, $new->minimumCoreVersion, '<')) {
                    $report = $report->withError(
                        "minimum_core_version raised to v{$new->minimumCoreVersion}, but current core is v{$coreVersion}."
                    );
                } else {
                    $report = $report->withWarning(
                        "minimum_core_version raised from v{$old->minimumCoreVersion} to v{$new->minimumCoreVersion}."
                    );
                }
            }
        } elseif ($new->minimumCoreVersion !== null && $old->minimumCoreVersion === null) {
            $coreVersion = config('lastarter.version', '1.0.0');
            if (version_compare($coreVersion, $new->minimumCoreVersion, '<')) {
                $report = $report->withError(
                    "New minimum_core_version v{$new->minimumCoreVersion} is above current core v{$coreVersion}."
                );
            }
        }

        return $report;
    }
}
