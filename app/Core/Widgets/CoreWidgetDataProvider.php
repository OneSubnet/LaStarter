<?php

namespace App\Core\Widgets;

use App\Core\Modules\Contracts\ProvidesWidgetData;
use App\Models\AuditLog;
use App\Models\Notification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

final class CoreWidgetDataProvider implements ProvidesWidgetData
{
    public function widgetData(string $widgetIdentifier, int $teamId, ?string $dateFrom = null, ?string $dateTo = null): ?array
    {
        return match ($widgetIdentifier) {
            'core-team-members' => $this->teamMembersData($teamId, $dateFrom, $dateTo),
            'core-activity' => $this->activityData($teamId, $dateFrom, $dateTo),
            'core-unread-notifications' => $this->unreadNotificationsData($dateFrom, $dateTo),
            default => null,
        };
    }

    public function supportedWidgets(): array
    {
        return [
            'core-team-members',
            'core-activity',
            'core-unread-notifications',
        ];
    }

    private function teamMembersData(int $teamId, ?string $dateFrom, ?string $dateTo): array
    {
        $activeUserIds = DB::table('sessions')
            ->where('last_activity', '>=', now()->subMinutes(5)->timestamp)
            ->pluck('user_id')
            ->filter()
            ->unique()
            ->values()
            ->all();

        $memberCount = DB::table('team_members')
            ->where('team_id', $teamId)
            ->where('status', 'active')
            ->count();

        $onlineCount = DB::table('team_members')
            ->where('team_id', $teamId)
            ->where('status', 'active')
            ->whereIn('user_id', $activeUserIds)
            ->count();

        $prevCount = $dateFrom
            ? DB::table('team_members')
                ->where('team_id', $teamId)
                ->where('status', 'active')
                ->where('created_at', '<', $dateFrom)
                ->count()
            : null;

        $trend = $prevCount !== null && $prevCount > 0
            ? round((($memberCount - $prevCount) / $prevCount) * 100, 1)
            : null;

        $members = DB::table('team_members')
            ->join('users', 'team_members.user_id', '=', 'users.id')
            ->where('team_id', $teamId)
            ->where('team_members.status', 'active')
            ->orderBy('team_members.created_at', 'desc')
            ->limit(20)
            ->select('users.name', 'users.id as user_id', 'team_members.created_at', 'team_members.role')
            ->get();

        return [
            'stat' => [
                'value' => $memberCount,
                'label' => 'Members',
                'icon' => 'Users',
                'trend' => $trend !== null ? [
                    'value' => abs($trend),
                    'direction' => $trend > 0 ? 'up' : ($trend < 0 ? 'down' : 'flat'),
                    'label' => 'vs previous period',
                ] : null,
            ],
            'chart' => [
                'type' => 'area',
                'data' => $this->membersOverTime($teamId, $dateFrom, $dateTo),
                'config' => ['members' => ['label' => 'Members', 'color' => 'var(--chart-1)']],
                'xAxisKey' => 'date',
                'dataKeys' => ['members'],
            ],
            'table' => [
                'columns' => [
                    ['key' => 'name', 'label' => 'Name'],
                    ['key' => 'role', 'label' => 'Role'],
                    ['key' => 'created_at', 'label' => 'Joined', 'type' => 'date'],
                ],
                'rows' => $members->map(fn ($m) => [
                    'id' => (string) $m->user_id,
                    'name' => $m->name,
                    'role' => $m->role,
                    'created_at' => $m->created_at,
                ])->all(),
            ],
            'memberCount' => $memberCount,
            'onlineCount' => $onlineCount,
        ];
    }

    private function activityData(int $teamId, ?string $dateFrom, ?string $dateTo): array
    {
        $query = AuditLog::where('team_id', $teamId)->with('user');

        if ($dateFrom) {
            $query->where('created_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->where('created_at', '<=', $dateTo);
        }

        $logs = $query->latest('created_at')
            ->limit(10)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'user' => $log->user?->name,
                'action' => $log->action,
                'module' => $log->module,
                'created_at' => $log->created_at?->toISOString(),
            ])
            ->all();

        $totalActions = AuditLog::where('team_id', $teamId)
            ->when($dateFrom, fn ($q) => $q->where('created_at', '>=', $dateFrom))
            ->when($dateTo, fn ($q) => $q->where('created_at', '<=', $dateTo))
            ->count();

        $actionsByDay = AuditLog::where('team_id', $teamId)
            ->when($dateFrom, fn ($q) => $q->where('created_at', '>=', $dateFrom))
            ->when($dateTo, fn ($q) => $q->where('created_at', '<=', $dateTo))
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupByRaw('DATE(created_at)')
            ->orderBy('date')
            ->limit(30)
            ->get()
            ->map(fn ($row) => ['date' => $row->date, 'actions' => $row->count])
            ->all();

        return [
            'stat' => [
                'value' => $totalActions,
                'label' => 'Actions',
                'icon' => 'Activity',
            ],
            'chart' => [
                'type' => 'bar',
                'data' => $actionsByDay,
                'config' => ['actions' => ['label' => 'Actions', 'color' => 'var(--chart-2)']],
                'xAxisKey' => 'date',
                'dataKeys' => ['actions'],
            ],
            'table' => [
                'columns' => [
                    ['key' => 'user', 'label' => 'User'],
                    ['key' => 'action', 'label' => 'Action'],
                    ['key' => 'created_at', 'label' => 'Time', 'type' => 'date'],
                ],
                'rows' => $logs,
                'clickable' => null,
            ],
            'items' => $logs,
        ];
    }

    private function unreadNotificationsData(?string $dateFrom, ?string $dateTo): ?array
    {
        $user = Auth::user();

        if ($user === null) {
            return null;
        }

        $count = Notification::forUser($user->id)->unread()->count();

        return [
            'stat' => [
                'value' => $count,
                'label' => 'Unread',
                'icon' => 'Bell',
            ],
            'count' => $count,
        ];
    }

    private function membersOverTime(int $teamId, ?string $dateFrom, ?string $dateTo): array
    {
        $from = $dateFrom ? now()->parse($dateFrom) : now()->subDays(30);
        $to = $dateTo ? now()->parse($dateTo) : now();

        $joins = DB::table('team_members')
            ->where('team_id', $teamId)
            ->where('status', 'active')
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupByRaw('DATE(created_at)')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $runningTotal = DB::table('team_members')
            ->where('team_id', $teamId)
            ->where('status', 'active')
            ->where('created_at', '<', $from)
            ->count();

        $result = [];
        $period = $from->toPeriod($to, '1 day');

        foreach ($period as $day) {
            $dateStr = $day->format('Y-m-d');
            $runningTotal += ($joins[$dateStr]?->count ?? 0);
            $result[] = ['date' => $dateStr, 'members' => $runningTotal];
        }

        return $result;
    }
}
