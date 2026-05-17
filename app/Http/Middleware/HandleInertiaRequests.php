<?php

namespace App\Http\Middleware;

use App\Core\Cache\CacheKey;
use App\Core\Context\AppContext;
use App\Core\Context\SharedPropsResolver;
use App\Core\Extensions\Updater\UpdateService;
use App\Core\Hooks\Hook;
use App\Core\Navigation\NavigationBuilder;
use App\Core\Settings\SettingManager;
use App\Core\Sidebar\ContextualSidebarPayload;
use App\Core\System\CoreVersion;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Middleware;

final class HandleInertiaRequests extends Middleware
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
        $team = $ctx->team();
        $resolver = app(SharedPropsResolver::class);

        $contextualSidebar = new ContextualSidebarPayload;
        Hook::dispatch(Hook::SIDEBAR_BUILD, $contextualSidebar);

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user,
                'permissions' => fn () => $ctx->permissions(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'currentTeam' => fn () => $user && $team ? $user->toUserTeam($team) : null,
            'teams' => fn () => $user ? $user->toUserTeams(includeCurrent: true) : [],
            'navigation' => fn () => $this->buildNavigation($ctx),
            'teamMembers' => fn () => $team ? $resolver->teamMembers($team) : [],
            'auditLogs' => fn () => $team ? $resolver->auditLogs($team) : [],
            'theme' => fn () => null,
            'locale' => $team?->locale ?? $user?->locale ?? app()->getLocale(),
            'fallbackLocale' => config('app.fallback_locale'),
            'availableLocales' => config('app.available_locales', ['en', 'fr']),
            'footerLinks' => fn () => $team ? $resolver->footerLinks($team) : [],
            'unreadNotifications' => fn () => $user ? $resolver->unreadNotificationCount($user) : 0,
            'recentNotifications' => fn () => $user ? $resolver->recentNotifications($user) : [],
            'unreadMessageCount' => fn () => 0,
            'availableWidgets' => fn () => ($user && $team) ? $resolver->availableWidgets($team, $user) : [],
            'coreVersion' => fn () => CoreVersion::current()->current,
            'coreUpdateAvailable' => fn () => Cache::remember(CacheKey::coreUpdateAvailable(), now()->addHours(12), function () {
                try {
                    return CoreVersion::current()->updateAvailable;
                } catch (\Throwable) {
                    return false;
                }
            }),
            'extensionUpdateCount' => fn () => Cache::remember(CacheKey::extensionUpdates(), now()->addHours(12), function () {
                try {
                    return count(app(UpdateService::class)->checkForUpdates());
                } catch (\Throwable) {
                    return 0;
                }
            }),
            'mailConfigured' => fn () => $team
                && (bool) app(SettingManager::class)->get('mail_host'),
            'contextualSidebar' => $contextualSidebar->isEmpty() ? null : $contextualSidebar->toArray(),
        ];
    }

    protected function buildNavigation(AppContext $ctx): array
    {
        $user = $ctx->user();
        $team = $ctx->team();

        if (! $user instanceof User || ! $team) {
            return [];
        }

        try {
            return app(NavigationBuilder::class)->build($team, $user);
        } catch (\Throwable $e) {
            logger()->error('Failed to build navigation: '.$e->getMessage());

            return [];
        }
    }
}
