<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;
use ZipArchive;

class ValidZipFile implements ValidationRule
{
    private const MAX_SIZE = 51200; // 50KB for security checks

    private const MAX_UNCOMPRESSED_SIZE = 10485760; // 10MB max when uncompressed

    private const MAX_FILE_COUNT = 1000; // Prevent zip bombs

    public function validate(string $attribute, mixed $value, callable $fail): void
    {
        if (! $value instanceof UploadedFile) {
            $fail('The :attribute must be a file.');

            return;
        }

        // Check file size (50MB max as per original validation)
        if ($value->getSize() > 51200 * 1024) {
            $fail('The :attribute must not be larger than 50MB.');

            return;
        }

        // Verify it's actually a ZIP file by magic bytes
        $handle = fopen($value->getRealPath(), 'rb');
        $magicBytes = fread($handle, 4);
        fclose($handle);

        // ZIP files start with PK\x03\x04 or PK\x05\x06 or PK\x07\x08
        if ($magicBytes !== "PK\x03\x04" && $magicBytes !== "PK\x05\x06" && $magicBytes !== "PK\x07\x08") {
            $fail('The :attribute is not a valid ZIP file.');

            return;
        }

        // Open and validate ZIP structure
        $zip = new ZipArchive;

        $result = $zip->open($value->getRealPath());

        if ($result !== true) {
            $fail('The :attribute is not a valid or corrupted ZIP file.');

            return;
        }

        // Security checks to prevent zip bombs and malicious archives
        $this->validateZipStructure($zip, $fail);

        $zip->close();
    }

    private function validateZipStructure(ZipArchive $zip, callable $fail): void
    {
        $fileCount = 0;
        $uncompressedSize = 0;

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $fileCount++;

            if ($fileCount > self::MAX_FILE_COUNT) {
                $fail('The :attribute contains too many files.');

                return;
            }

            $stat = $zip->statIndex($i);

            if ($stat === false) {
                continue;
            }

            $uncompressedSize += $stat['size'];

            if ($uncompressedSize > self::MAX_UNCOMPRESSED_SIZE) {
                $fail('The :attribute would be too large when uncompressed.');

                return;
            }

            // Check for path traversal attempts
            $name = $stat['name'];

            if (str_starts_with($name, '/') || str_contains($name, '..')) {
                $fail('The :attribute contains invalid file paths.');

                return;
            }

            // Check for suspicious file types that shouldn't be in extensions
            $extension = strtolower(pathinfo($name, PATHINFO_EXTENSION));
            $suspiciousExtensions = ['exe', 'dll', 'so', 'dylib', 'sh', 'bat', 'cmd', 'ps1'];

            if (in_array($extension, $suspiciousExtensions)) {
                $fail('The :attribute contains files of a type that are not allowed.');

                return;
            }

            // For PHP files, check for potentially dangerous content
            if ($extension === 'php' || $extension === 'phtml') {
                $content = $zip->getFromIndex($i);

                if ($content && $this->containsSuspiciousPhpCode($content)) {
                    $fail('The :attribute contains potentially dangerous code.');

                    return;
                }
            }
        }

        // Ensure the ZIP is not empty
        if ($fileCount === 0) {
            $fail('The :attribute is empty.');

            return;
        }
    }

    private function containsSuspiciousPhpCode(string $content): bool
    {
        // Patterns that shouldn't appear in extension PHP files
        // Note: This is a basic check - a proper sandbox would be better
        $suspiciousPatterns = [
            '/eval\s*\(/i',
            '/assert\s*\(/i',
            '/create_function\s*\(/i',
            '/base64_decode\s*\(/i',
            '/system\s*\(/i',
            '/exec\s*\(/i',
            '/shell_exec\s*\(/i',
            '/passthru\s*\(/i',
            '/proc_open\s*\(/i',
            '/`.*?`/s', // Backtick operator
            '/\$_(GET|POST|REQUEST|COOKIE|SERVER)\[/i',
        ];

        foreach ($suspiciousPatterns as $pattern) {
            if (preg_match($pattern, $content)) {
                return true;
            }
        }

        return false;
    }
}
