<?php

namespace App\Core\Cache\Listeners;

use App\Core\Cache\CacheKey;
use App\Core\Extensions\Events\ExtensionDisabled;
use App\Core\Extensions\Events\ExtensionEnabled;
use Illuminate\Support\Facades\Cache;

final class InvalidateCacheListener
{
    public function handleExtensionEnabled(ExtensionEnabled $event): void
    {
        $this->flushTeam($event->teamId);
    }

    public function handleExtensionDisabled(ExtensionDisabled $event): void
    {
        $this->flushTeam($event->teamId);
    }

    public function handleExtensionInstalled(): void
    {
        $this->flushGlobal();
    }

    public function handleExtensionUninstalled(): void
    {
        $this->flushGlobal();
    }

    public function handleThemeChanged(): void
    {
        $this->flushGlobal();
    }

    public function handleSettingsChanged(): void
    {
        $this->flushGlobal();
    }

    private function flushTeam(int $teamId): void
    {
        Cache::forget(CacheKey::extensionUpdates());
        app('cache')->getStore()->flush();
    }

    private function flushGlobal(): void
    {
        Cache::forget(CacheKey::coreUpdateAvailable());
        Cache::forget(CacheKey::extensionUpdates());
        Cache::forget(CacheKey::extensionList());
        app('cache')->getStore()->flush();
    }
}
