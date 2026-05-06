<?php

namespace App\Core\Modules;

use App\Http\Middleware\EnsureTeamMembership;
use Illuminate\Support\Facades\Route;

final class ModuleRouteRegistrar
{
    /**
     * Register module routes wrapped in team-scoped middleware.
     */
    public function register(string $routesPath, string $prefix = ''): void
    {
        $urlPrefix = '{current_team}';

        if ($prefix !== '') {
            $urlPrefix .= '/'.ltrim($prefix, '/');
        }

        Route::middleware(['web', 'auth', 'verified', EnsureTeamMembership::class])
            ->prefix($urlPrefix)
            ->group($routesPath);
    }
}
