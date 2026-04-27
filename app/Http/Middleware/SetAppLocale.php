<?php

namespace App\Http\Middleware;

use App\Core\Context\AppContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetAppLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $ctx = app(AppContext::class);
        $team = $ctx->team();

        if ($team && $team->locale) {
            app()->setLocale($team->locale);
        } elseif ($request->user()) {
            app()->setLocale($request->user()->locale ?? config('app.locale'));
        }

        return $next($request);
    }
}
