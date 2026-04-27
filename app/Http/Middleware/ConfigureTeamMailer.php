<?php

namespace App\Http\Middleware;

use App\Concerns\ConfiguresTeamMailer;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ConfigureTeamMailer
{
    use ConfiguresTeamMailer;

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user?->currentTeam) {
            $this->configureTeamMailer($user->currentTeam->id);
        }

        return $next($request);
    }
}
