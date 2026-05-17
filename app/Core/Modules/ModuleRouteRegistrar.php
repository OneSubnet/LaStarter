<?php

namespace App\Core\Modules;

use App\Http\Middleware\EnsureTeamMembership;
use Illuminate\Support\Facades\Route;

final class ModuleRouteRegistrar
{
    /**
     * Register module routes wrapped in team-scoped and extension-state middleware.
     */
    public function register(string $routesPath, string $identifier = '', string $prefix = ''): void
    {
        $urlPrefix = '{current_team}';

        if ($prefix !== '') {
            $urlPrefix .= '/'.ltrim($prefix, '/');
        }

        $middleware = ['web', 'auth', 'verified', EnsureTeamMembership::class];

        if ($identifier !== '') {
            $middleware[] = 'extension:'.$identifier;
        }

        Route::middleware($middleware)
            ->prefix($urlPrefix)
            ->group($routesPath);
    }
}
