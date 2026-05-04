<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;

class ValidImageFile implements ValidationRule
{
    private const ALLOWED_TYPES = [
        IMAGETYPE_JPEG => 'jpg',
        IMAGETYPE_PNG => 'png',
        IMAGETYPE_WEBP => 'webp',
        // Note: SVG validation is handled separately due to security concerns
    ];

    private const MAX_DIMENSION = 4096;

    private const MIN_DIMENSION = 32;

    private ?string $error = null;

    public function validate(string $attribute, mixed $value, callable $fail): void
    {
        if (! $value instanceof UploadedFile) {
            $fail('The :attribute must be a file.');

            return;
        }

        // Check file size (5MB max)
        if ($value->getSize() > 5120 * 1024) {
            $fail('The :attribute must not be larger than 5MB.');

            return;
        }

        // Get file extension
        $extension = strtolower($value->getClientOriginalExtension());

        // Handle SVG separately - they can contain malicious scripts
        if ($extension === 'svg' || $extension === 'svgz') {
            $this->validateSvg($value, $fail);

            return;
        }

        // Validate image content
        $imageInfo = @getimagesize($value->getRealPath());

        if ($imageInfo === false) {
            $fail('The :attribute is not a valid image file.');

            return;
        }

        // Check if the detected image type matches allowed types
        $detectedType = $imageInfo[2];

        if (! isset(self::ALLOWED_TYPES[$detectedType])) {
            $fail('The :attribute must be a JPEG, PNG, or WebP image.');

            return;
        }

        // Verify the extension matches the detected type
        $detectedExtension = self::ALLOWED_TYPES[$detectedType];
        if (! in_array($extension, [$detectedExtension, $this->getAlternativeExtension($detectedType)])) {
            $fail('The :attribute file extension does not match its content.');

            return;
        }

        // Validate dimensions
        $width = $imageInfo[0];
        $height = $imageInfo[1];

        if ($width < self::MIN_DIMENSION || $height < self::MIN_DIMENSION) {
            $fail('The :attribute must be at least '.self::MIN_DIMENSION.'x'.self::MIN_DIMENSION.' pixels.');

            return;
        }

        if ($width > self::MAX_DIMENSION || $height > self::MAX_DIMENSION) {
            $fail('The :attribute must not exceed '.self::MAX_DIMENSION.'x'.self::MAX_DIMENSION.' pixels.');

            return;
        }

        // Additional security: check for embedded threats in images
        $this->validateImageContent($value, $fail);
    }

    private function validateSvg(UploadedFile $file, callable $fail): void
    {
        $content = $file->get();

        // Check file size limit for SVGs (100KB max to prevent complex attack vectors)
        if ($file->getSize() > 102400) {
            $fail('The :attribute SVG file must not be larger than 100KB.');

            return;
        }

        // Check for potentially dangerous SVG elements
        $dangerousPatterns = [
            '/<script/i',
            '/javascript:/i',
            '/onload=/i',
            '/onerror=/i',
            '/onclick=/i',
            '/<embed/i',
            '/<iframe/i',
            '/<object/i',
            '/xlink:href\s*=\s*["\']?javascript:/i',
            '/data:text\/html/i',
            '/vbscript:/i',
        ];

        foreach ($dangerousPatterns as $pattern) {
            if (preg_match($pattern, $content)) {
                $fail('The :attribute contains potentially dangerous content.');

                return;
            }
        }

        // Verify it's actually an SVG
        if (! str_starts_with(trim($content), '<svg') && ! str_starts_with(trim($content), '<?xml')) {
            $fail('The :attribute is not a valid SVG file.');

            return;
        }
    }

    private function validateImageContent(UploadedFile $file, callable $fail): void
    {
        // Read first few bytes to check for embedded content
        $handle = fopen($file->getRealPath(), 'rb');
        $header = fread($handle, 4096);
        fclose($handle);

        // Check for suspicious content in image header
        $suspiciousPatterns = [
            '/<script/i',
            '/javascript:/i',
            '/<?php/i',
        ];

        foreach ($suspiciousPatterns as $pattern) {
            if (preg_match($pattern, $header)) {
                $fail('The :attribute contains embedded content that is not allowed.');

                return;
            }
        }
    }

    private function getAlternativeExtension(int $imageType): string
    {
        return match ($imageType) {
            IMAGETYPE_JPEG => 'jpeg',
            IMAGETYPE_PNG => 'png',
            IMAGETYPE_WEBP => 'webp',
            default => '',
        };
    }
}
