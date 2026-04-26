<?php

namespace Modules\AilesInvisibles\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateClient
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! Auth::guard('client')->check()) {
            if ($request->expectsJson()) {
                abort(401);
            }

            return redirect()->route('portal.login');
        }

        return $next($request);
    }
}
