<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpFoundation\Response;

class SetPermissionsTeamId
{
    /**
     * Set the Spatie permissions team ID for the current request context.
     *
     * This ensures that all permission checks via Spatie are scoped
     * to the user's current team (organisation).
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $teamId = $request->user()?->current_team_id;

        if ($teamId) {
            app(PermissionRegistrar::class)->setPermissionsTeamId($teamId);
        }

        return $next($request);
    }
}
