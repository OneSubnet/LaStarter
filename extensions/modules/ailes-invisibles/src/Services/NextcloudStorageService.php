<?php

namespace Modules\AilesInvisibles\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class NextcloudStorageService
{
    private ?string $baseUrl;

    private ?string $username;

    private ?string $password;

    private string $basePath;

    public function __construct()
    {
        $this->baseUrl = config('services.nextcloud.url');
        $this->username = config('services.nextcloud.username');
        $this->password = config('services.nextcloud.password');
        $this->basePath = config('services.nextcloud.base_path', 'AilesInvisibles');
    }

    public function isConfigured(): bool
    {
        return ! empty($this->baseUrl) && ! empty($this->username) && ! empty($this->password);
    }

    public function upload(string $path, mixed $content, ?string $teamSlug = null): string
    {
        $remotePath = $this->buildPath($path, $teamSlug);
        $this->ensureDirectory(dirname($remotePath));

        $response = $this->client()
            ->withBody($content, 'application/octet-stream')
            ->put($this->webdavUrl($remotePath));

        if (! $response->successful()) {
            Log::error('Nextcloud upload failed', ['path' => $remotePath, 'status' => $response->status()]);
            throw new RuntimeException('Failed to upload file to Nextcloud');
        }

        return $remotePath;
    }

    public function uploadFile(string $localPath, string $remoteName, ?string $teamSlug = null): string
    {
        $remotePath = $this->buildPath($remoteName, $teamSlug);
        $this->ensureDirectory(dirname($remotePath));

        $response = $this->client()
            ->attach('file', file_get_contents($localPath), $remoteName)
            ->put($this->webdavUrl($remotePath));

        if (! $response->successful()) {
            Log::error('Nextcloud file upload failed', ['path' => $remotePath, 'status' => $response->status()]);
            throw new RuntimeException('Failed to upload file to Nextcloud');
        }

        return $remotePath;
    }

    public function download(string $remotePath): string
    {
        $response = $this->client()->get($this->webdavUrl($remotePath));

        if (! $response->successful()) {
            throw new RuntimeException('Failed to download file from Nextcloud');
        }

        return $response->body();
    }

    public function downloadToTemp(string $remotePath): string
    {
        $content = $this->download($remotePath);
        $tempPath = tempnam(sys_get_temp_dir(), 'nc_');
        file_put_contents($tempPath, $content);

        return $tempPath;
    }

    public function delete(string $remotePath): bool
    {
        $response = $this->client()->delete($this->webdavUrl($remotePath));

        return $response->successful();
    }

    public function listFiles(string $directory = '/', ?string $teamSlug = null): array
    {
        $remotePath = $this->buildPath($directory, $teamSlug);

        $response = $this->client()
            ->withHeaders(['Depth' => '1'])
            ->send('PROPFIND', $this->webdavUrl($remotePath), [
                'body' => '<?xml version="1.0"?><d:propfind xmlns:d="DAV:"><d:prop><d:displayname/><d:getcontentlength/><d:getlastmodified/><d:getcontenttype/></d:prop></d:propfind>',
            ]);

        if (! $response->successful()) {
            return [];
        }

        return $this->parsePropfindResponse($response->body());
    }

    public function ensureDirectory(string $path): void
    {
        $segments = explode('/', trim($path, '/'));
        $currentPath = '';

        foreach ($segments as $segment) {
            $currentPath .= '/'.$segment;
            $this->client()->withHeaders(['Depth' => '0'])
                ->send('MKCOL', $this->webdavUrl($currentPath));
        }
    }

    private function buildPath(string $path, ?string $teamSlug): string
    {
        $base = $teamSlug ? "{$this->basePath}/{$teamSlug}" : $this->basePath;

        return $base.'/'.ltrim($path, '/');
    }

    private function webdavUrl(string $path): string
    {
        return rtrim($this->baseUrl, '/').'/remote.php/dav/files/'.$this->username.'/'.ltrim($path, '/');
    }

    private function client(): PendingRequest
    {
        return Http::withBasicAuth($this->username, $this->password)
            ->withHeaders(['OCS-APIRequest' => 'true'])
            ->timeout(30);
    }

    private function parsePropfindResponse(string $xml): array
    {
        $results = [];
        libxml_use_internal_errors(true);
        $doc = simplexml_load_string($xml);

        if (! $doc) {
            return [];
        }

        $doc->registerXPathNamespace('d', 'DAV:');

        foreach ($doc->xpath('//d:response') as $response) {
            $response->registerXPathNamespace('d', 'DAV:');
            $href = (string) ($response->xpath('d:href')[0] ?? '');
            $name = basename($href);

            if ($name === basename($this->basePath) || empty($name)) {
                continue;
            }

            $results[] = [
                'name' => $name,
                'path' => $href,
                'size' => (int) ($response->xpath('.//d:getcontentlength')[0] ?? 0),
                'modified' => (string) ($response->xpath('.//d:getlastmodified')[0] ?? ''),
                'type' => (string) ($response->xpath('.//d:getcontenttype')[0] ?? ''),
            ];
        }

        return $results;
    }
}
