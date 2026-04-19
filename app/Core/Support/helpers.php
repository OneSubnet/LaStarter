<?php

use App\Core\Settings\SettingManager;

if (! function_exists('setting')) {
    /**
     * Get or set a team setting value.
     */
    function setting(string $key, mixed $default = null): mixed
    {
        return app(SettingManager::class)->get($key, $default);
    }
}

if (! function_exists('setting_set')) {
    /**
     * Set a team setting value.
     */
    function setting_set(string $key, mixed $value): void
    {
        app(SettingManager::class)->set($key, $value);
    }
}
