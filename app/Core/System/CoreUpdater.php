<?php

namespace App\Core\System;

use App\Core\Cache\CacheKey;
use App\Core\System\Events\CoreUpdateCompleted;
use App\Core\System\Events\CoreUpdateFailed;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use ZipArchive;

final class CoreUpdater
{
    public function __construct(
        private readonly ReleaseClient $releases,
        private readonly BackupManager $backups,
        private readonly CompatibilityChecker $compatibility,
    ) {}

    /**
     * Check for a core update via GitHub releases (with 12h cache).
     */
    public function checkForUpdate(): CoreVersion
    {
        $current = CoreVersion::current();

        try {
            $release = cache()->remember(CacheKey::coreUpdateAvailable().':release', now()->addHours(12), function (): ?ReleaseInfo {
                return $this->releases->latestRelease();
            });
        } catch (\Throwable $e) {
            Log::warning('Core update check failed: '.$e->getMessage());

            return $current;
        }

        if ($release === null) {
            return $current;
        }

        $updateAvailable = version_compare($release->version, $current->current, '>');

        return new CoreVersion(
            current: $current->current,
            latest: $release->version,
            changelog: $release->body,
            updateAvailable: $updateAvailable,
        );
    }

    /**
     * Run the core update process.
     *
     * Flow: check → compatibility → backup → download → verify hash → extract → artisan commands
     */
    public function update(bool $force = false, bool $skipBackup = false): CoreUpdateResult
    {
        $current = CoreVersion::current();
        $release = $this->releases->latestRelease();

        if ($release === null) {
            Event::dispatch(new CoreUpdateFailed($current->current, null, ['No release found.']));

            return CoreUpdateResult::failed(['No release found.']);
        }

        if (! $force && version_compare($release->version, $current->current, '<=')) {
            Event::dispatch(new CoreUpdateFailed($current->current, $release->version, ['Already up to date.']));

            return CoreUpdateResult::failed(['Already up to date.']);
        }

        // Step 1: Compatibility check
        $report = $this->compatibility->canUpdateCore($release->version);

        if (! $report->compatible) {
            Event::dispatch(new CoreUpdateFailed($current->current, $release->version, $report->errors));

            return CoreUpdateResult::failed($report->errors);
        }

        // Step 2: Backup
        $backupPath = null;
        if (! $skipBackup) {
            try {
                $backupPath = $this->backups->create();
                Log::info("Core update backup created: {$backupPath}");
            } catch (\Throwable $e) {
                Event::dispatch(new CoreUpdateFailed($current->current, $release->version, [
                    'Backup failed: '.$e->getMessage(),
                ]));

                return CoreUpdateResult::failed(['Backup failed: '.$e->getMessage()]);
            }
        }

        // Step 3: Download
        $zipPath = $this->releases->downloadRelease($release);

        if ($zipPath === null) {
            Event::dispatch(new CoreUpdateFailed($current->current, $release->version, ['Download failed.']));

            return CoreUpdateResult::failed(['Download failed.'], $backupPath);
        }

        // Step 4: Verify integrity (SHA256)
        if ($release->zipUrl !== null) {
            $hash = hash_file('sha256', $zipPath);
            Log::info("Core update ZIP downloaded: {$zipPath} (SHA256: {$hash})");

            if ($release->zipHash !== null && ! hash_equals($release->zipHash, $hash)) {
                @unlink($zipPath);
                Event::dispatch(new CoreUpdateFailed($current->current, $release->version, [
                    'Integrity check failed: SHA256 hash mismatch.',
                ]));

                return CoreUpdateResult::failed(['Integrity check failed: SHA256 hash mismatch.'], $backupPath);
            }
        }

        // Step 5: Extract and replace files
        try {
            $this->extractAndReplace($zipPath);
        } catch (\Throwable $e) {
            Event::dispatch(new CoreUpdateFailed($current->current, $release->version, [
                'Extraction failed: '.$e->getMessage(),
            ]));

            return CoreUpdateResult::failed(['Extraction failed: '.$e->getMessage()], $backupPath);
        } finally {
            @unlink($zipPath);
        }

        // Step 6: Post-update commands
        try {
            $this->runPostUpdateCommands();
        } catch (\Throwable $e) {
            Log::warning('Post-update commands failed: '.$e->getMessage());
            // Non-fatal — the update itself succeeded
        }

        // Step 7: Update version in .env
        $this->updateVersionConfig($release->version);

        // Clear caches
        cache()->forget(CacheKey::coreUpdateAvailable().':release');
        cache()->forget(CacheKey::coreUpdateAvailable());
        cache()->forget(CacheKey::extensionUpdates());

        Log::info("Core updated from v{$current->current} to v{$release->version}");

        Event::dispatch(new CoreUpdateCompleted(
            $current->current,
            $release->version,
            $backupPath,
        ));

        return CoreUpdateResult::success($current->current, $release->version, $backupPath);
    }

    /**
     * Extract the ZIP and replace core files (preserving .env, storage, extensions, vendor, node_modules).
     */
    private function extractAndReplace(string $zipPath): void
    {
        $zip = new ZipArchive;

        if (! $zip->open($zipPath)) {
            throw new \RuntimeException('Cannot open update archive.');
        }

        // Validate ZIP entries for path traversal (Zip Slip protection)
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);

            if (str_contains($name, '..') || str_starts_with($name, '/') || str_starts_with($name, '\\')) {
                $zip->close();
                throw new \RuntimeException('Update archive contains suspicious path entries.');
            }
        }

        $tmpDir = sys_get_temp_dir().'/lastarter_update_'.time();
        mkdir($tmpDir, 0755, true);

        $zip->extractTo($tmpDir);
        $zip->close();

        // GitHub archives wrap in a top-level directory — find it
        $sourceDir = $this->findSourceDirectory($tmpDir);

        if ($sourceDir === null) {
            throw new \RuntimeException('Invalid archive structure: no source directory found.');
        }

        $preserve = ['.env', '.env.production', 'storage', 'extensions', 'vendor', 'node_modules', 'public/build'];
        $base = base_path();

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($sourceDir, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST,
        );

        foreach ($iterator as $item) {
            $relative = substr($item->getPathname(), strlen($sourceDir) + 1);
            $destination = $base.'/'.$relative;

            // Skip preserved paths
            foreach ($preserve as $preserved) {
                if (str_starts_with($relative, $preserved)) {
                    continue 2;
                }
            }

            if ($item->isDir()) {
                if (! is_dir($destination)) {
                    mkdir($destination, 0755, true);
                }
            } else {
                $dir = dirname($destination);
                if (! is_dir($dir)) {
                    mkdir($dir, 0755, true);
                }
                copy($item->getPathname(), $destination);
            }
        }

        // Cleanup temp directory
        $this->removeDirectory($tmpDir);
    }

    /**
     * Find the top-level directory inside the extracted archive.
     */
    private function findSourceDirectory(string $extractedPath): ?string
    {
        $entries = scandir($extractedPath);

        foreach ($entries as $entry) {
            if ($entry === '.' || $entry === '..') {
                continue;
            }

            $fullPath = $extractedPath.'/'.$entry;

            if (is_dir($fullPath) && file_exists($fullPath.'/composer.json')) {
                return $fullPath;
            }
        }

        // Fallback: if composer.json is at root
        if (file_exists($extractedPath.'/composer.json')) {
            return $extractedPath;
        }

        return null;
    }

    private function runPostUpdateCommands(): void
    {
        $phpBinary = PHP_BINARY;
        $composerBinary = $this->resolveBinary('composer');

        $commands = [
            "{$composerBinary} install --no-dev --optimize-autoloader 2>&1",
            "{$phpBinary} artisan migrate --force 2>&1",
            "{$phpBinary} artisan config:cache 2>&1",
            "{$phpBinary} artisan route:cache 2>&1",
            "{$phpBinary} artisan view:cache 2>&1",
        ];

        foreach ($commands as $command) {
            exec($command, $output, $exitCode);

            if ($exitCode !== 0) {
                Log::warning("Post-update command failed: {$command}", [
                    'output' => implode("\n", $output),
                    'exit_code' => $exitCode,
                ]);
            }
        }
    }

    private function updateVersionConfig(string $newVersion): void
    {
        $envPath = base_path('.env');

        if (! file_exists($envPath)) {
            return;
        }

        $content = file_get_contents($envPath);

        if (preg_match('/^APP_VERSION=.*/m', $content)) {
            $content = preg_replace('/^APP_VERSION=.*/m', "APP_VERSION={$newVersion}", $content);
        } else {
            $content .= "\nAPP_VERSION={$newVersion}\n";
        }

        file_put_contents($envPath, $content);
    }

    private function resolveBinary(string $name): string
    {
        exec("which {$name} 2>/dev/null", $output, $exitCode);

        if ($exitCode === 0 && ! empty($output[0])) {
            return $output[0];
        }

        return $name;
    }

    private function removeDirectory(string $dir): void
    {
        if (! is_dir($dir)) {
            return;
        }

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST,
        );

        foreach ($iterator as $item) {
            if ($item->isDir()) {
                @rmdir($item->getPathname());
            } else {
                @unlink($item->getPathname());
            }
        }

        @rmdir($dir);
    }
}
