<?php

namespace App\Core\Hooks;

use Illuminate\Support\Facades\Event;

class Hook
{
    // Standard hook names
    public const string SIDEBAR_BUILD = 'sidebar.build';

    public const string DASHBOARD_RENDER = 'dashboard.render';

    public const string MODULE_BOOT = 'module.boot';

    public const string EXTENSION_ENABLED = 'extension.enabled';

    public const string EXTENSION_DISABLED = 'extension.disabled';

    public const string EXTENSION_INSTALLED = 'extension.installed';

    public const string EXTENSION_UNINSTALLED = 'extension.uninstalled';

    public const string EXTENSION_ERROR = 'extension.error';

    public const string THEME_CHANGED = 'theme.changed';

    /**
     * Register a listener for a hook event.
     */
    public static function listen(string $event, callable|string $listener): void
    {
        Event::listen("hooks.{$event}", $listener);
    }

    /**
     * Dispatch a hook event.
     */
    public static function dispatch(string $event, array $data = []): void
    {
        Event::dispatch("hooks.{$event}", $data);
    }

    /**
     * Remove all listeners for a hook event.
     */
    public static function forget(string $event): void
    {
        Event::forget("hooks.{$event}");
    }
}
