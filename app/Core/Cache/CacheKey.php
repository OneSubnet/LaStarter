<?php

namespace App\Core\Cache;

final class CacheKey
{
    private const PREFIX = 'lastarter';

    public static function navigation(int $teamId, int $userId): string
    {
        return sprintf('%s:nav:%d:%d', self::PREFIX, $teamId, $userId);
    }

    public static function settings(int $teamId, string $key): string
    {
        return sprintf('%s:settings:%d:%s', self::PREFIX, $teamId, $key);
    }

    public static function settingsAll(int $teamId): string
    {
        return sprintf('%s:settings:%d:*', self::PREFIX, $teamId);
    }

    public static function permissions(int $teamId, int $userId): string
    {
        return sprintf('%s:perms:%d:%d', self::PREFIX, $teamId, $userId);
    }

    public static function coreUpdateAvailable(): string
    {
        return sprintf('%s:core:update_available', self::PREFIX);
    }

    public static function extensionUpdates(): string
    {
        return sprintf('%s:core:extension_updates', self::PREFIX);
    }

    public static function extensionList(): string
    {
        return sprintf('%s:ext:list', self::PREFIX);
    }
}
