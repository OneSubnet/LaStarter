<?php

namespace App\Core\Hooks;

use Illuminate\Support\Facades\Event;

final class Hook
{
    public const string SIDEBAR_BUILD = 'sidebar.build';

    public const string MODULE_BOOT = 'module.boot';

    public const string EXTENSION_ENABLED = 'extension.enabled';

    public const string EXTENSION_DISABLED = 'extension.disabled';

    public const string EXTENSION_INSTALLED = 'extension.installed';

    public const string EXTENSION_UNINSTALLED = 'extension.uninstalled';

    public const string EXTENSION_ERROR = 'extension.error';

    public const string THEME_CHANGED = 'theme.changed';

    public static function listen(string $hook, callable $callback): void
    {
        Event::listen("hooks.{$hook}", $callback);
    }

    public static function dispatch(string $hook, mixed $data = null): void
    {
        Event::dispatch("hooks.{$hook}", $data);
    }
}
