<?php

namespace App\Http\Middleware;

use App\Core\Extensions\ExtensionManager;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureExtensionEnabled
{
    public function __construct(
        private readonly ExtensionManager $extensions,
    ) {}

    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $identifier): Response
    {
        $team = $request->route('current_team');

        $teamId = is_object($team) ? $team->id : null;

        if (! $teamId || ! $this->extensions->isEnabled($identifier, $teamId)) {
            abort(404);
        }

        return $next($request);
    }
}
