<?php

namespace App\Core\System;

use Illuminate\Support\Facades\File;
use ZipArchive;

final class BackupManager
{
    /**
     * Directories and files to include in a backup.
     */
    private const array BACKUP_PATHS = [
        'app',
        'config',
        'resources',
        'routes',
        'database/migrations',
        'bootstrap',
        'composer.json',
        'composer.lock',
        'package.json',
        'bun.lock',
    ];

    /**
     * Paths to exclude from the ZIP archive.
     */
    private const array EXCLUDE_PATTERNS = [
        'node_modules',
        'vendor',
        '.git',
        'storage',
        'extensions',
        'public/build',
    ];

    public function __construct(
        private readonly string $backupPath,
    ) {}

    public function create(): string
    {
        if (! is_dir($this->backupPath)) {
            File::makeDirectory($this->backupPath, 0755, true);
        }

        $timestamp = now()->format('Ymd_His');
        $zipPath = $this->backupPath."/backup_{$timestamp}.zip";

        $zip = new ZipArchive;

        if (! $zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE)) {
            throw new \RuntimeException("Cannot create backup archive: {$zipPath}");
        }

        $base = base_path();

        foreach (self::BACKUP_PATHS as $relativePath) {
            $fullPath = $base.'/'.$relativePath;

            if (is_file($fullPath)) {
                $zip->addFile($fullPath, $relativePath);
            } elseif (is_dir($fullPath)) {
                $this->addDirectoryToZip($zip, $fullPath, $relativePath);
            }
        }

        $zip->close();

        $this->cleanup();

        return $zipPath;
    }

    public function restore(string $backupPath): bool
    {
        if (! file_exists($backupPath)) {
            return false;
        }

        $zip = new ZipArchive;

        if (! $zip->open($backupPath)) {
            return false;
        }

        $zip->extractTo(base_path());
        $zip->close();

        return true;
    }

    public function cleanup(int $keepLast = 5): void
    {
        $backups = $this->list();

        if (count($backups) <= $keepLast) {
            return;
        }

        $toDelete = array_slice($backups, 0, count($backups) - $keepLast);

        foreach ($toDelete as $backup) {
            @unlink($backup['path']);
        }
    }

    /**
     * @return list<array{path: string, size: int, created_at: string}>
     */
    public function list(): array
    {
        if (! is_dir($this->backupPath)) {
            return [];
        }

        $files = glob($this->backupPath.'/backup_*.zip') ?: [];

        return collect($files)
            ->map(fn (string $path) => [
                'path' => $path,
                'size' => filesize($path),
                'created_at' => date('c', filemtime($path)),
            ])
            ->sortBy('created_at')
            ->values()
            ->all();
    }

    private function addDirectoryToZip(ZipArchive $zip, string $dir, string $relativePrefix): void
    {
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST,
        );

        foreach ($iterator as $item) {
            $relativePath = $relativePrefix.'/'.substr($item->getPathname(), strlen($dir) + 1);

            // Skip excluded patterns
            foreach (self::EXCLUDE_PATTERNS as $pattern) {
                if (str_contains($relativePath, $pattern)) {
                    continue 2;
                }
            }

            if ($item->isDir()) {
                $zip->addEmptyDir($relativePath);
            } else {
                $zip->addFile($item->getPathname(), $relativePath);
            }
        }
    }
}
