<?php

namespace App\Http\Middleware;

use App\Models\Team;
use Closure;
use Illuminate\Http\Request;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpFoundation\Response;

class EnsureTeamMembership
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, ?string $permission = null): Response
    {
        $user = $request->user();
        $team = $this->team($request);

        abort_if(! $user || ! $team || ! $user->belongsToTeam($team), 403);

        // Replace the raw slug with the resolved Team model so that
        // downstream code ($request->route('current_team')) receives
        // a Team instance instead of a string.
        if ($request->route()->hasParameter('current_team')) {
            $request->route()->setParameter('current_team', $team);
        }

        // Set Spatie team context for permission checks
        app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);

        if ($permission !== null) {
            abort_unless($user->hasPermissionTo($permission), 403);
        }

        if (! $user->isCurrentTeam($team)) {
            $user->switchTeam($team);
        }

        return $next($request);
    }

    /**
     * Get the team associated with the request.
     */
    protected function team(Request $request): ?Team
    {
        $team = $request->route('current_team') ?? $request->route('team');

        if (is_string($team)) {
            $team = Team::where('slug', $team)->first();
        }

        return $team;
    }
}
