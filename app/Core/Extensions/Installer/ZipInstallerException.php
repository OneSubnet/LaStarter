<?php

namespace App\Core\Extensions\Installer;

final class ZipInstallerException extends \RuntimeException
{
    public static function fileNotFound(string $path): self
    {
        logger()->warning("ZIP file not found: {$path}");

        return new self('The uploaded file could not be found.');
    }

    public static function fileTooLarge(int $maxBytes): self
    {
        return new self("ZIP file exceeds maximum size of {$maxBytes} bytes.");
    }

    public static function invalidZip(): self
    {
        return new self('The uploaded file is not a valid ZIP archive.');
    }

    public static function downloadFailed(string $owner, string $repo): self
    {
        return new self("Failed to download release from {$owner}/{$repo}.");
    }
}
