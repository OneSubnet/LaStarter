<?php

namespace App\Core\Modules;

use App\Http\Middleware\EnsureTeamMembership;
use Illuminate\Support\Facades\Route;

class ModuleRouteRegistrar
{
    /**
     * Register module routes under the team-scoped route group.
     */
    public function register(string $routesPath): void
    {
        Route::middleware(['auth', 'verified', EnsureTeamMembership::class])
            ->prefix('{current_team}')
            ->group($routesPath);
    }
}
