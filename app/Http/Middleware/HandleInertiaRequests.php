<?php

namespace App\Http\Middleware;

use App\Core\Context\AppContext;
use App\Core\Navigation\NavigationBuilder;
use App\Core\Themes\ComponentResolver;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $ctx = app(AppContext::class);
        $user = $ctx->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user,
                'permissions' => fn () => $ctx->permissions(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'currentTeam' => fn () => $user ? $user->toUserTeam($ctx->team()) : null,
            'teams' => fn () => $user ? $user->toUserTeams(includeCurrent: true) : [],
            'navigation' => fn () => $this->buildNavigation($ctx),
            'theme' => fn () => $this->resolveTheme($ctx),
        ];
    }

    protected function buildNavigation(AppContext $ctx): array
    {
        $user = $ctx->user();
        $team = $ctx->team();

        if (! $user || ! $team) {
            return [];
        }

        try {
            return app(NavigationBuilder::class)->build('app', $team->id, $user);
        } catch (\Throwable $e) {
            logger()->error('Failed to build navigation: '.$e->getMessage());

            return [];
        }
    }

    protected function resolveTheme(AppContext $ctx): ?string
    {
        $team = $ctx->team();

        if (! $team) {
            return null;
        }

        try {
            return app(ComponentResolver::class)->activeTheme($team->id);
        } catch (\Throwable $e) {
            logger()->error('Failed to resolve theme: '.$e->getMessage());

            return null;
        }
    }
}
