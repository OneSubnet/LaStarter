<?php

namespace App\Core\System;

use Illuminate\Support\Facades\Crypt;

final class SignedDownloadUrl
{
    private const int DEFAULT_TTL_SECONDS = 300; // 5 minutes

    /**
     * Generate a signed download URL for a backup file.
     */
    public function generate(string $filename, int $ttlSeconds = self::DEFAULT_TTL_SECONDS): string
    {
        $payload = Crypt::encryptString(json_encode([
            'filename' => $filename,
            'expires_at' => now()->addSeconds($ttlSeconds)->getTimestamp(),
        ], JSON_THROW_ON_ERROR));

        $signature = $this->sign($payload);

        return url('/backups/download?payload='.urlencode($payload).'&signature='.urlencode($signature));
    }

    /**
     * Validate a signed download request and return the filename, or null if invalid.
     */
    public function validate(string $payload, string $signature): ?string
    {
        if (! hash_equals($this->sign($payload), $signature)) {
            return null;
        }

        try {
            $data = json_decode(Crypt::decryptString($payload), true, 512, JSON_THROW_ON_ERROR);
        } catch (\Throwable) {
            return null;
        }

        if (! isset($data['filename'], $data['expires_at'])) {
            return null;
        }

        if ($data['expires_at'] < now()->getTimestamp()) {
            return null;
        }

        return $data['filename'];
    }

    private function sign(string $payload): string
    {
        return hash_hmac('sha256', $payload, config('app.key'));
    }
}
