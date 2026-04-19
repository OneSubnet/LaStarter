<?php

namespace App\Core\Settings\Facades;

use App\Core\Settings\SettingManager;
use Illuminate\Support\Facades\Facade;

/**
 * @method static mixed get(string $key, mixed $default = null)
 * @method static void set(string $key, mixed $value)
 * @method static void forget(string $key)
 * @method static array all()
 */
class Setting extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return SettingManager::class;
    }
}
