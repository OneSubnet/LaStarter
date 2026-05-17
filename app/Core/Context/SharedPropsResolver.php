<?php

namespace App\Core\Context;

use App\Core\Widgets\WidgetRegistry;
use App\Models\AuditLog;
use App\Models\Notification;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

final class SharedPropsResolver
{
    /**
     * @return list<array{id: int, name: string, email: string, avatar: ?string, role_label: string, is_online: bool}>
     */
    public function teamMembers(Team $team): array
    {
        return Cache::remember(
            "props.team_members.{$team->id}",
            now()->addSeconds(60),
            fn () => $this->resolveTeamMembers($team),
        );
    }

    /**
     * @return list<array{id: int, user: ?string, action: string, module: ?string, properties: ?array, created_at: ?string}>
     */
    public function auditLogs(Team $team): array
    {
        return Cache::remember(
            "props.audit_logs.{$team->id}",
            now()->addSeconds(30),
            fn () => $this->resolveAuditLogs($team),
        );
    }

    /**
     * @return list<array{id: string, title: ?string, body: ?string, data: ?array, read_at: ?string, created_at: ?string}>
     */
    public function recentNotifications(User $user): array
    {
        return Notification::forUser($user->id)
            ->latest('created_at')
            ->limit(5)
            ->get()
            ->map(fn (Notification $n) => [
                'id' => $n->id,
                'title' => $n->title,
                'body' => $n->body,
                'data' => $n->data,
                'read_at' => $n->read_at?->toISOString(),
                'created_at' => $n->created_at?->toISOString(),
            ])
            ->all();
    }

    public function unreadNotificationCount(User $user): int
    {
        return Notification::forUser($user->id)->unread()->count();
    }

    /**
     * @return list<mixed>
     */
    public function footerLinks(Team $team): array
    {
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

    /**
     * @return list<array<string, mixed>>
     */
    public function availableWidgets(Team $team, User $user): array
    {
        try {
            return app(WidgetRegistry::class)->forTeam($team->id, $user);
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * @return list<array{id: int, name: string, email: string, avatar: ?string, role_label: string, is_online: bool}>
     */
    private function resolveTeamMembers(Team $team): array
    {
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

    /**
     * @return list<array{id: int, user: ?string, action: string, module: ?string, properties: ?array, created_at: ?string}>
     */
    private function resolveAuditLogs(Team $team): array
    {
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
}
