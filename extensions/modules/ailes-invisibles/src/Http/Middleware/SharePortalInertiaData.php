<?php

namespace Modules\AilesInvisibles\Http\Middleware;

use App\Concerns\TeamScope;
use App\Models\AuditLog;
use App\Models\Notification;
use App\Models\Team;
use App\Models\TeamSetting;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class SharePortalInertiaData
{
    public function handle(Request $request, Closure $next): Response
    {
        $clientUser = Auth::guard('client')->user();

        if ($clientUser) {
            $team = Team::withoutGlobalScope(TeamScope::class)->find($clientUser->team_id);
            $footerLinks = $this->resolveTeamFooterLinks($clientUser->team_id);

            Inertia::share([
                'portalClient' => [
                    'name' => $clientUser->name ?? $clientUser->email,
                    'email' => $clientUser->email,
                ],
                'currentTeam' => $team ? [
                    'id' => $team->id,
                    'name' => $team->name,
                    'slug' => $team->slug,
                    'iconUrl' => $team->iconUrl(),
                ] : null,
                'footerLinks' => $footerLinks,
                'auditLogs' => fn () => $this->resolvePortalAuditLogs($clientUser->team_id),
                'unreadNotifications' => fn () => $this->resolvePortalUnreadNotificationCount($clientUser),
                'recentNotifications' => fn () => $this->resolvePortalRecentNotifications($clientUser),
            ]);
        }

        return $next($request);
    }

    protected function resolveTeamFooterLinks(int $teamId): array
    {
        $setting = TeamSetting::where('team_id', $teamId)
            ->where('key', 'footer_links')
            ->first();

        if (! $setting?->value) {
            return [];
        }

        return json_decode($setting->value, true) ?? [];
    }

    protected function resolvePortalAuditLogs(int $teamId): array
    {
        return AuditLog::withoutGlobalScope(TeamScope::class)
            ->where('team_id', $teamId)
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

    protected function resolvePortalUnreadNotificationCount(object $clientUser): int
    {
        return Notification::where('notifiable_type', get_class($clientUser))
            ->where('notifiable_id', $clientUser->id)
            ->whereNull('read_at')
            ->count();
    }

    protected function resolvePortalRecentNotifications(object $clientUser): array
    {
        return Notification::where('notifiable_type', get_class($clientUser))
            ->where('notifiable_id', $clientUser->id)
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
