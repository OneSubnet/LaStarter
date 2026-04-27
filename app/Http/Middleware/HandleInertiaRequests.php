<?php

namespace App\Http\Middleware;

use App\Core\Context\AppContext;
use App\Core\Extensions\ExtensionManager;
use App\Core\Navigation\NavigationBuilder;
use App\Core\Themes\ComponentResolver;
use App\Models\AuditLog;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
            'teamMembers' => fn () => $this->resolveTeamMembers($ctx),
            'auditLogs' => fn () => $this->resolveAuditLogs($ctx),
            'theme' => fn () => $this->resolveTheme($ctx),
            'locale' => $ctx->team()?->locale ?? $user?->locale ?? app()->getLocale(),
            'fallbackLocale' => config('app.fallback_locale'),
            'availableLocales' => config('app.available_locales', ['en', 'fr']),
            'footerLinks' => fn () => $this->resolveFooterLinks($ctx),
            'unreadNotifications' => fn () => $this->resolveUnreadNotificationCount($ctx),
            'recentNotifications' => fn () => $this->resolveRecentNotifications($ctx),
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

    protected function resolveTeamMembers(AppContext $ctx): array
    {
        $team = $ctx->team();

        if (! $team) {
            return [];
        }

        $activeUserIds = DB::table('sessions')
            ->where('last_activity', '>=', now()->subMinutes(5)->timestamp)
            ->pluck('user_id')
            ->filter()
            ->unique()
            ->values()
            ->all();

        return $team->members()
            ->wherePivot('status', 'active')
            ->get()
            ->map(fn ($member) => [
                'id' => $member->id,
                'name' => $member->name,
                'email' => $member->email,
                'avatar' => $member->avatar,
                'role_label' => $member->pivot->getRawOriginal('role') ?? 'Member',
                'is_online' => in_array($member->id, $activeUserIds),
            ])
            ->values()
            ->all();
    }

    protected function resolveAuditLogs(AppContext $ctx): array
    {
        $team = $ctx->team();

        if (! $team) {
            return [];
        }

        return AuditLog::where('team_id', $team->id)
            ->with('user')
            ->latest('created_at')
            ->limit(10)
            ->get()
            ->map(fn (AuditLog $log) => [
                'id' => $log->id,
                'user' => $log->user?->name,
                'action' => $log->action,
                'module' => $log->module,
                'properties' => $log->properties,
                'created_at' => $log->created_at?->toISOString(),
            ])
            ->all();
    }

    protected function resolveTheme(AppContext $ctx): ?string
    {
        $team = $ctx->team();

        if (! $team) {
            return null;
        }

        try {
            $identifier = app(ComponentResolver::class)->activeTheme($team->id);

            if (! $identifier) {
                return null;
            }

            $manager = app(ExtensionManager::class);

            if (! $manager->isEnabled($identifier, $team->id)) {
                return null;
            }

            return $identifier;
        } catch (\Throwable $e) {
            logger()->error('Failed to resolve theme: '.$e->getMessage());

            return null;
        }
    }

    protected function resolveFooterLinks(AppContext $ctx): array
    {
        $team = $ctx->team();

        if (! $team) {
            return [];
        }

        try {
            $links = setting('footer_links');

            if (! $links) {
                return [];
            }

            return json_decode($links, true) ?? [];
        } catch (\Throwable) {
            return [];
        }
    }

    protected function resolveUnreadNotificationCount(AppContext $ctx): int
    {
        $user = $ctx->user();

        if (! $user) {
            return 0;
        }

        return Notification::forUser($user->id)->unread()->count();
    }

    protected function resolveRecentNotifications(AppContext $ctx): array
    {
        $user = $ctx->user();

        if (! $user) {
            return [];
        }

        return Notification::forUser($user->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn (Notification $n) => [
                'id' => $n->id,
                'title' => $n->title,
                'body' => $n->body,
                'data' => $n->data,
                'read_at' => $n->read_at?->toISOString(),
                'created_at' => $n->created_at->toISOString(),
            ])
            ->all();
    }
}
