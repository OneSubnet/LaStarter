<?php

namespace App\Core\System;

use Illuminate\Support\Facades\File;
use ZipArchive;

final class BackupManager
{
    public const string CORE_PREFIX = 'core_';

    public const string EXT_PREFIX = 'ext_';

    public const string DB_PREFIX = 'db_';

    private const array CORE_BACKUP_PATHS = [
        'app',
        'config',
        'resources',
        'routes',
        'database/migrations',
        'bootstrap',
        'extensions',
        'composer.json',
        'composer.lock',
        'package.json',
        'bun.lock',
    ];

    private const array EXCLUDE_PATTERNS = [
        'node_modules',
        'vendor',
        '.git',
        'storage',
        'public/build',
    ];

    public function __construct(
        private readonly string $backupPath,
    ) {}

    // ──────────────────────────────────────────────
    // Core backup
    // ──────────────────────────────────────────────

    public function create(): string
    {
        $this->ensureDirectory();

        $timestamp = now()->format('Ymd_His');
        $zipPath = $this->backupPath.'/'.self::CORE_PREFIX."{$timestamp}.zip";

        $zip = $this->openZip($zipPath);

        foreach (self::CORE_BACKUP_PATHS as $relativePath) {
            $fullPath = base_path($relativePath);

            if (is_file($fullPath)) {
                $zip->addFile($fullPath, $relativePath);
            } elseif (is_dir($fullPath)) {
                $this->addDirectoryToZip($zip, $fullPath, $relativePath);
            }
        }

        $zip->close();
        $this->cleanup(self::CORE_PREFIX, 5);

        return $zipPath;
    }

    // ──────────────────────────────────────────────
    // Extension backup
    // ──────────────────────────────────────────────

    public function createExtensionBackup(string $extensionPath, string $identifier): string
    {
        $this->ensureDirectory();

        $timestamp = now()->format('Ymd_His');
        $zipPath = $this->backupPath.'/'.self::EXT_PREFIX."{$identifier}_{$timestamp}.zip";

        $zip = $this->openZip($zipPath);

        if (is_dir($extensionPath)) {
            $this->addDirectoryToZip($zip, $extensionPath, $identifier);
        }

        $zip->close();

        return $zipPath;
    }

    // ──────────────────────────────────────────────
    // Database backup
    // ──────────────────────────────────────────────

    public function createDatabaseBackup(): string
    {
        $this->ensureDirectory();

        $timestamp = now()->format('Ymd_His');
        $driver = config('database.default');

        if ($driver === 'sqlite') {
            return $this->backupSqlite($timestamp);
        }

        if ($driver === 'pgsql') {
            return $this->backupPgsql($timestamp);
        }

        if ($driver === 'mysql') {
            return $this->backupMysql($timestamp);
        }

        throw new \RuntimeException("Unsupported database driver: {$driver}");
    }

    private function backupSqlite(string $timestamp): string
    {
        $dbPath = config('database.connections.sqlite.database');

        if (! $dbPath || ! file_exists($dbPath)) {
            throw new \RuntimeException('SQLite database file not found.');
        }

        $backupPath = $this->backupPath.'/'.self::DB_PREFIX."{$timestamp}.sqlite";
        copy($dbPath, $backupPath);

        return $backupPath;
    }

    private function backupPgsql(string $timestamp): string
    {
        $conn = config('database.connections.pgsql');

        $command = sprintf(
            'PGPASSWORD=%s pg_dump -h %s -p %s -U %s %s --no-owner --no-acl',
            escapeshellarg($conn['password']),
            escapeshellarg($conn['host']),
            escapeshellarg((string) $conn['port']),
            escapeshellarg($conn['username']),
            escapeshellarg($conn['database']),
        );

        return $this->runDumpCommand($timestamp, $command, 'pg_dump');
    }

    private function backupMysql(string $timestamp): string
    {
        $conn = config('database.connections.mysql');

        $command = sprintf(
            'mysqldump -h %s -P %s -u %s -p%s %s --no-tablespaces',
            escapeshellarg($conn['host']),
            escapeshellarg((string) $conn['port']),
            escapeshellarg($conn['username']),
            escapeshellarg($conn['password']),
            escapeshellarg($conn['database']),
        );

        return $this->runDumpCommand($timestamp, $command, 'mysqldump');
    }

    private function runDumpCommand(string $timestamp, string $command, string $binary): string
    {
        $backupPath = $this->backupPath.'/'.self::DB_PREFIX."{$timestamp}.sql";

        exec("{$command} > ".escapeshellarg($backupPath).' 2>/dev/null', $output, $exitCode);

        if ($exitCode !== 0 && ! file_exists($backupPath)) {
            throw new \RuntimeException("{$binary} failed. Is {$binary} installed and accessible?");
        }

        return $backupPath;
    }

    // ──────────────────────────────────────────────
    // Listing
    // ──────────────────────────────────────────────

    /**
     * @return list<array{filename: string, path: string, type: string, size: int, created_at: string}>
     */
    public function listAll(): array
    {
        if (! is_dir($this->backupPath)) {
            return [];
        }

        $pattern = sprintf(
            '%s/{%s*,%s*,%s*}',
            $this->backupPath,
            self::CORE_PREFIX,
            self::EXT_PREFIX,
            self::DB_PREFIX,
        );
        $files = glob($pattern, GLOB_BRACE) ?: [];

        return collect($files)
            ->map(fn (string $path) => [
                'filename' => basename($path),
                'path' => $path,
                'type' => $this->detectType(basename($path)),
                'size' => filesize($path),
                'created_at' => date('c', filemtime($path)),
            ])
            ->sortByDesc('created_at')
            ->values()
            ->all();
    }

    public function delete(string $filename): bool
    {
        $path = $this->resolvePath($filename);

        if ($path === null) {
            return false;
        }

        return @unlink($path);
    }

    public function restore(string $filename): bool
    {
        $path = $this->resolvePath($filename);

        if ($path === null) {
            return false;
        }

        $basename = basename($path);

        if (str_starts_with($basename, self::CORE_PREFIX)) {
            $zip = new ZipArchive;

            if (! $zip->open($path)) {
                return false;
            }

            if (! $this->validateZipEntries($zip)) {
                $zip->close();

                return false;
            }

            $zip->extractTo(base_path());
            $zip->close();

            return true;
        }

        if (str_starts_with($basename, self::DB_PREFIX)) {
            return $this->restoreDatabase($path);
        }

        return false;
    }

    private function restoreDatabase(string $backupPath): bool
    {
        $driver = config('database.default');

        if ($driver === 'sqlite') {
            $dbPath = config('database.connections.sqlite.database');

            if (! $dbPath) {
                return false;
            }

            copy($backupPath, $dbPath);

            return true;
        }

        if ($driver === 'pgsql') {
            $conn = config('database.connections.pgsql');
            $command = sprintf(
                'PGPASSWORD=%s psql -h %s -p %s -U %s %s < %s 2>/dev/null',
                escapeshellarg($conn['password']),
                escapeshellarg($conn['host']),
                escapeshellarg((string) $conn['port']),
                escapeshellarg($conn['username']),
                escapeshellarg($conn['database']),
                escapeshellarg($backupPath),
            );
            exec($command, $output, $exitCode);

            return $exitCode === 0;
        }

        if ($driver === 'mysql') {
            $conn = config('database.connections.mysql');
            $command = sprintf(
                'mysql -h %s -P %s -u %s -p%s %s < %s 2>/dev/null',
                escapeshellarg($conn['host']),
                escapeshellarg((string) $conn['port']),
                escapeshellarg($conn['username']),
                escapeshellarg($conn['password']),
                escapeshellarg($conn['database']),
                escapeshellarg($backupPath),
            );
            exec($command, $output, $exitCode);

            return $exitCode === 0;
        }

        return false;
    }

    public function cleanup(string $prefix = self::CORE_PREFIX, int $keepLast = 5): void
    {
        $backups = collect($this->listAll())
            ->filter(fn (array $b) => str_starts_with($b['filename'], $prefix))
            ->sortBy('created_at')
            ->values();

        if ($backups->count() <= $keepLast) {
            return;
        }

        $toDelete = $backups->take($backups->count() - $keepLast);

        foreach ($toDelete as $backup) {
            @unlink($backup['path']);
        }
    }

    // ──────────────────────────────────────────────
    // Internal
    // ──────────────────────────────────────────────

    /**
     * Resolve the absolute path for a backup filename, or null if invalid.
     */
    public function resolvePath(string $filename): ?string
    {
        $dir = rtrim($this->backupPath, '/\\');
        $path = $dir.DIRECTORY_SEPARATOR.$filename;

        if (! file_exists($path) || ! str_starts_with(realpath($path), realpath($dir))) {
            return null;
        }

        return $path;
    }

    public function detectType(string $filename): string
    {
        if (str_starts_with($filename, self::CORE_PREFIX)) {
            return 'core';
        }

        if (str_starts_with($filename, self::EXT_PREFIX)) {
            return 'extension';
        }

        if (str_starts_with($filename, self::DB_PREFIX)) {
            return 'database';
        }

        return 'unknown';
    }

    /**
     * Validate ZIP entries for path traversal (Zip Slip protection).
     */
    private function validateZipEntries(ZipArchive $zip): bool
    {
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);

            if (str_contains($name, '..') || str_starts_with($name, '/') || str_starts_with($name, '\\')) {
                return false;
            }
        }

        return true;
    }

    private function ensureDirectory(): void
    {
        if (! is_dir($this->backupPath)) {
            File::makeDirectory($this->backupPath, 0755, true);
        }
    }

    private function openZip(string $path): ZipArchive
    {
        $zip = new ZipArchive;

        if (! $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE)) {
            throw new \RuntimeException("Cannot create backup archive: {$path}");
        }

        return $zip;
    }

    private function addDirectoryToZip(ZipArchive $zip, string $dir, string $relativePrefix): void
    {
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST,
        );

        foreach ($iterator as $item) {
            $relativePath = $relativePrefix.'/'.substr($item->getPathname(), strlen($dir) + 1);

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
