<?php

namespace App\Core\Modules;

use Illuminate\Support\Facades\Route;

class ModuleRouteRegistrar
{
    /**
     * Register module routes under the team-scoped route group.
     */
    public function register(string $routesPath): void
    {
        // Use middleware alias instead of class reference to avoid autoloading issues
        Route::middleware(['auth', 'verified', 'team.membership'])
            ->prefix('{current_team}')
            ->group($routesPath);
    }
}
