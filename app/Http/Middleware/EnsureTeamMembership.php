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

        // Set Spatie team context for permission checks
        app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);

        if ($permission !== null) {
            abort_unless($user->hasPermissionTo($permission), 403);
        }

        if ($request->route('current_team') && ! $user->isCurrentTeam($team)) {
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
