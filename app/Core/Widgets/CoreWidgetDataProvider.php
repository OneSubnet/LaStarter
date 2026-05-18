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
            'core-online-members' => $this->onlineMembersData($teamId),
            'core-activity' => $this->activityData($teamId, $dateFrom, $dateTo),
            'core-unread-notifications' => $this->unreadNotificationsData($dateFrom, $dateTo),
            'core-active-extensions' => $this->activeExtensionsData($teamId),
            'core-team-roles' => $this->teamRolesData($teamId),
            'core-member-activity' => $this->memberActivityData($teamId, $dateFrom, $dateTo),
            'core-audit-by-module' => $this->auditByModuleData($teamId, $dateFrom, $dateTo),
            'core-session-trend' => $this->sessionTrendData($teamId),
            'core-permission-coverage' => $this->permissionCoverageData($teamId),
            'core-notification-response' => $this->notificationResponseData($teamId, $dateFrom, $dateTo),
            'core-onboarding-progress' => $this->onboardingProgressData($teamId),
            'core-member-joins' => $this->memberJoinsData($teamId, $dateFrom, $dateTo),
            'core-top-actions' => $this->topActionsData($teamId, $dateFrom, $dateTo),
            'core-security-overview' => $this->securityOverviewData($teamId),
            'core-notification-types' => $this->notificationTypesData($teamId, $dateFrom, $dateTo),
            default => null,
        };
    }

    public function supportedWidgets(): array
    {
        return [
            'core-team-members',
            'core-online-members',
            'core-activity',
            'core-unread-notifications',
            'core-active-extensions',
            'core-team-roles',
            'core-member-activity',
            'core-audit-by-module',
            'core-session-trend',
            'core-permission-coverage',
            'core-notification-response',
            'core-onboarding-progress',
            'core-member-joins',
            'core-top-actions',
            'core-security-overview',
            'core-notification-types',
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

    private function onlineMembersData(int $teamId): array
    {
        $activeUserIds = DB::table('sessions')
            ->where('last_activity', '>=', now()->subMinutes(5)->timestamp)
            ->pluck('user_id')
            ->filter()
            ->unique()
            ->values()
            ->all();

        $onlineMembers = DB::table('team_members')
            ->join('users', 'team_members.user_id', '=', 'users.id')
            ->where('team_members.team_id', $teamId)
            ->where('team_members.status', 'active')
            ->whereIn('users.id', $activeUserIds)
            ->select('users.name')
            ->get();

        $totalMembers = DB::table('team_members')
            ->where('team_id', $teamId)
            ->where('status', 'active')
            ->count();

        return [
            'stat' => [
                'value' => $onlineMembers->count(),
                'label' => 'Online',
                'icon' => 'Users',
                'trend' => $totalMembers > 0 ? [
                    'value' => round(($onlineMembers->count() / $totalMembers) * 100),
                    'direction' => 'up',
                    'label' => "of {$totalMembers} members",
                ] : null,
            ],
            'table' => [
                'columns' => [
                    ['key' => 'name', 'label' => 'Member'],
                ],
                'rows' => $onlineMembers->map(fn ($m) => ['id' => $m->name, 'name' => $m->name])->all(),
            ],
        ];
    }

    private function activeExtensionsData(int $teamId): array
    {
        $total = DB::table('extensions')->count();
        $enabled = DB::table('team_extensions')
            ->where('team_id', $teamId)
            ->where('is_active', true)
            ->count();

        $extensions = DB::table('extensions')
            ->leftJoin('team_extensions', function ($join) use ($teamId) {
                $join->on('extensions.id', '=', 'team_extensions.extension_id')
                    ->where('team_extensions.team_id', $teamId);
            })
            ->select('extensions.name', 'extensions.type', 'team_extensions.is_active')
            ->orderByDesc('team_extensions.is_active')
            ->get();

        return [
            'stat' => [
                'value' => $enabled,
                'label' => 'Extensions',
                'icon' => 'Package',
                'trend' => $total > 0 ? [
                    'value' => round(($enabled / $total) * 100),
                    'direction' => $enabled === $total ? 'up' : 'flat',
                    'label' => "of {$total} available",
                ] : null,
            ],
            'table' => [
                'columns' => [
                    ['key' => 'name', 'label' => 'Extension'],
                    ['key' => 'type', 'label' => 'Type'],
                ],
                'rows' => $extensions->map(fn ($e) => [
                    'id' => $e->name,
                    'name' => $e->name,
                    'type' => $e->type,
                ])->all(),
            ],
        ];
    }

    private function teamRolesData(int $teamId): array
    {
        $roles = DB::table('roles')
            ->where('team_id', $teamId)
            ->leftJoin('model_has_roles', 'roles.id', '=', 'model_has_roles.role_id')
            ->groupBy('roles.id', 'roles.name')
            ->select('roles.name', DB::raw('COUNT(model_has_roles.model_id) as member_count'))
            ->get();

        $totalMembers = DB::table('team_members')
            ->where('team_id', $teamId)
            ->where('status', 'active')
            ->count();

        return [
            'stat' => [
                'value' => $roles->count(),
                'label' => 'Roles',
                'icon' => 'Shield',
            ],
            'table' => [
                'columns' => [
                    ['key' => 'name', 'label' => 'Role'],
                    ['key' => 'member_count', 'label' => 'Members', 'type' => 'number'],
                ],
                'rows' => $roles->map(fn ($r) => [
                    'id' => $r->name,
                    'name' => $r->name,
                    'member_count' => $r->member_count,
                ])->all(),
            ],
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

    // ── Cross-referenced data widgets ─────────────────────

    /**
     * Most active members ranked by audit log actions.
     * Cross-references: team_members + audit_logs + users
     */
    private function memberActivityData(int $teamId, ?string $dateFrom, ?string $dateTo): array
    {
        $query = AuditLog::where('team_id', $teamId)
            ->select('user_id', DB::raw('COUNT(*) as action_count'))
            ->groupBy('user_id')
            ->orderByDesc('action_count')
            ->limit(10);

        if ($dateFrom) {
            $query->where('created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->where('created_at', '<=', $dateTo);
        }

        $topActors = $query->get();

        $userIds = $topActors->pluck('user_id')->filter()->unique()->values()->all();
        $users = DB::table('users')->whereIn('id', $userIds)->pluck('name', 'id');

        $totalActions = AuditLog::where('team_id', $teamId)
            ->when($dateFrom, fn ($q) => $q->where('created_at', '>=', $dateFrom))
            ->when($dateTo, fn ($q) => $q->where('created_at', '<=', $dateTo))
            ->count();

        $activeMembers = $topActors->count();

        return [
            'stat' => [
                'value' => $activeMembers,
                'label' => 'Active Members',
                'icon' => 'UserCheck',
                'trend' => $totalActions > 0 ? [
                    'value' => $totalActions,
                    'direction' => 'up',
                    'label' => 'total actions',
                ] : null,
            ],
            'table' => [
                'columns' => [
                    ['key' => 'name', 'label' => 'Member'],
                    ['key' => 'action_count', 'label' => 'Actions', 'type' => 'number'],
                ],
                'rows' => $topActors->map(fn ($a) => [
                    'id' => (string) $a->user_id,
                    'name' => $users[$a->user_id] ?? 'System',
                    'action_count' => $a->action_count,
                ])->all(),
            ],
            'items' => $topActors->map(fn ($a) => [
                'id' => (string) $a->user_id,
                'user' => $users[$a->user_id] ?? 'System',
                'action_count' => $a->action_count,
            ])->all(),
        ];
    }

    /**
     * Actions grouped by module over time.
     * Cross-references: audit_logs grouped by module
     */
    private function auditByModuleData(int $teamId, ?string $dateFrom, ?string $dateTo): array
    {
        $from = $dateFrom ? now()->parse($dateFrom) : now()->subDays(30);
        $to = $dateTo ? now()->parse($dateTo) : now();

        $byModule = AuditLog::where('team_id', $teamId)
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('COALESCE(module, ?) as module, COUNT(*) as count', ['unknown'])
            ->groupByRaw('COALESCE(module, ?)', ['unknown'])
            ->orderByDesc('count')
            ->get();

        $totalActions = $byModule->sum('count');

        $dailyByModule = AuditLog::where('team_id', $teamId)
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('DATE(created_at) as date, module, COUNT(*) as count')
            ->groupByRaw('DATE(created_at), module')
            ->orderBy('date')
            ->get();

        $chartData = $dailyByModule->groupBy('date')->map(fn ($group, $date) => array_merge(
            ['date' => $date],
            $group->pluck('count', 'module')->mapWithKeys(fn ($c, $m) => [$m => $c])->all(),
        ))->values()->all();

        $config = [];
        $colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
        foreach ($byModule as $i => $m) {
            $config[$m->module] = ['label' => ucfirst($m->module), 'color' => $colors[$i % count($colors)]];
        }

        return [
            'stat' => [
                'value' => $totalActions,
                'label' => 'Actions',
                'icon' => 'Layers',
            ],
            'chart' => [
                'type' => 'bar',
                'data' => $chartData,
                'config' => $config,
                'xAxisKey' => 'date',
                'dataKeys' => $byModule->pluck('module')->all(),
                'stacked' => true,
            ],
            'table' => [
                'columns' => [
                    ['key' => 'module', 'label' => 'Module'],
                    ['key' => 'count', 'label' => 'Actions', 'type' => 'number'],
                ],
                'rows' => $byModule->map(fn ($m) => [
                    'id' => $m->module,
                    'module' => ucfirst($m->module),
                    'count' => $m->count,
                ])->all(),
            ],
        ];
    }

    /**
     * Active sessions and unique visitors.
     * Cross-references: sessions + team_members
     */
    private function sessionTrendData(int $teamId): array
    {
        $activeThreshold = now()->subMinutes(5)->timestamp;

        $activeSessions = DB::table('sessions')
            ->where('last_activity', '>=', $activeThreshold)
            ->count();

        $teamUserIds = DB::table('team_members')
            ->where('team_id', $teamId)
            ->where('status', 'active')
            ->pluck('user_id')
            ->all();

        $activeTeamSessions = DB::table('sessions')
            ->whereIn('user_id', $teamUserIds)
            ->where('last_activity', '>=', $activeThreshold)
            ->count();

        $totalMembers = count($teamUserIds);
        $onlineRate = $totalMembers > 0 ? round(($activeTeamSessions / $totalMembers) * 100) : 0;

        $hourlyActivity = DB::table('sessions')
            ->whereIn('user_id', $teamUserIds)
            ->where('last_activity', '>=', now()->subHours(24)->timestamp)
            ->selectRaw('(last_activity - ?) / 3600 as hour_slot, COUNT(DISTINCT user_id) as unique_users', [now()->subHours(24)->timestamp])
            ->groupByRaw('hour_slot')
            ->orderBy('hour_slot')
            ->get()
            ->map(fn ($r) => ['hour' => (int) $r->hour_slot, 'users' => $r->unique_users])
            ->all();

        return [
            'stat' => [
                'value' => $activeTeamSessions,
                'label' => 'Online',
                'icon' => 'Wifi',
                'trend' => $totalMembers > 0 ? [
                    'value' => $onlineRate,
                    'direction' => $onlineRate > 50 ? 'up' : 'flat',
                    'label' => "% of {$totalMembers} members",
                ] : null,
            ],
            'chart' => [
                'type' => 'area',
                'data' => $hourlyActivity,
                'config' => ['users' => ['label' => 'Active Users', 'color' => 'var(--chart-3)']],
                'xAxisKey' => 'hour',
                'dataKeys' => ['users'],
            ],
        ];
    }

    /**
     * Permissions assigned per role.
     * Cross-references: roles + role_has_permissions + model_has_roles
     */
    private function permissionCoverageData(int $teamId): array
    {
        $roles = DB::table('roles')
            ->where('team_id', $teamId)
            ->get();

        $totalPermissions = DB::table('permissions')->count();

        $roleCoverage = $roles->map(function ($role) use ($totalPermissions) {
            $permCount = DB::table('role_has_permissions')
                ->where('role_id', $role->id)
                ->count();

            $memberCount = DB::table('model_has_roles')
                ->where('role_id', $role->id)
                ->count();

            return [
                'id' => $role->name,
                'name' => $role->name,
                'permission_count' => $permCount,
                'coverage' => $totalPermissions > 0 ? round(($permCount / $totalPermissions) * 100) : 0,
                'member_count' => $memberCount,
            ];
        })->all();

        $avgCoverage = count($roleCoverage) > 0
            ? round(array_sum(array_column($roleCoverage, 'coverage')) / count($roleCoverage))
            : 0;

        return [
            'stat' => [
                'value' => $avgCoverage.'%',
                'label' => 'Avg Coverage',
                'icon' => 'Key',
                'trend' => $totalPermissions > 0 ? [
                    'value' => $totalPermissions,
                    'direction' => 'flat',
                    'label' => 'total permissions',
                ] : null,
            ],
            'table' => [
                'columns' => [
                    ['key' => 'name', 'label' => 'Role'],
                    ['key' => 'permission_count', 'label' => 'Permissions', 'type' => 'number'],
                    ['key' => 'coverage', 'label' => 'Coverage', 'type' => 'number'],
                    ['key' => 'member_count', 'label' => 'Members', 'type' => 'number'],
                ],
                'rows' => $roleCoverage,
            ],
        ];
    }

    /**
     * Notification read rate and response time.
     * Cross-references: notifications read_at vs created_at
     */
    private function notificationResponseData(int $teamId, ?string $dateFrom, ?string $dateTo): array
    {
        $query = DB::table('notifications')->where('team_id', $teamId);

        if ($dateFrom) {
            $query->where('created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->where('created_at', '<=', $dateTo);
        }

        $total = $query->count();
        $read = (clone $query)->whereNotNull('read_at')->count();

        $readRate = $total > 0 ? round(($read / $total) * 100) : 0;

        $avgResponseMinutes = (clone $query)
            ->whereNotNull('read_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, created_at, read_at)) as avg_minutes')
            ->value('avg_minutes');

        $avgLabel = $avgResponseMinutes !== null
            ? ($avgResponseMinutes < 60
                ? round($avgResponseMinutes).'min'
                : round($avgResponseMinutes / 60).'h')
            : '-';

        return [
            'stat' => [
                'value' => $readRate.'%',
                'label' => 'Read Rate',
                'icon' => 'MailCheck',
                'trend' => $total > 0 ? [
                    'value' => $total - $read,
                    'direction' => $read === $total ? 'up' : 'down',
                    'label' => 'unread',
                ] : null,
            ],
            'stat2' => [
                'value' => $avgLabel,
                'label' => 'Avg Response',
            ],
            'stat3' => [
                'value' => $total,
                'label' => 'Total Sent',
            ],
        ];
    }

    /**
     * Onboarding completion rate for team members.
     * Cross-references: team_members + users.onboarding_completed
     */
    private function onboardingProgressData(int $teamId): array
    {
        $members = DB::table('team_members')
            ->join('users', 'team_members.user_id', '=', 'users.id')
            ->where('team_members.team_id', $teamId)
            ->where('team_members.status', 'active')
            ->select('users.id', 'users.name', 'users.onboarding_completed', 'users.onboarding_step')
            ->get();

        $total = $members->count();
        $completed = $members->where('onboarding_completed', true)->count();
        $rate = $total > 0 ? round(($completed / $total) * 100) : 0;

        $inProgress = $members->where('onboarding_completed', false)->whereNotNull('onboarding_step')->values();

        return [
            'stat' => [
                'value' => $rate.'%',
                'label' => 'Completed',
                'icon' => 'GraduationCap',
                'trend' => $total > 0 ? [
                    'value' => $completed.'/'.$total,
                    'direction' => $rate >= 80 ? 'up' : ($rate >= 50 ? 'flat' : 'down'),
                    'label' => 'members finished',
                ] : null,
            ],
            'table' => [
                'columns' => [
                    ['key' => 'name', 'label' => 'Member'],
                    ['key' => 'status', 'label' => 'Status'],
                ],
                'rows' => $inProgress->map(fn ($m) => [
                    'id' => (string) $m->id,
                    'name' => $m->name,
                    'status' => "Step {$m->onboarding_step}",
                ])->all(),
            ],
        ];
    }

    /**
     * New member registrations over time.
     * Cross-references: team_members.created_at aggregated by day/week
     */
    private function memberJoinsData(int $teamId, ?string $dateFrom, ?string $dateTo): array
    {
        $from = $dateFrom ? now()->parse($dateFrom) : now()->subDays(30);
        $to = $dateTo ? now()->parse($dateTo) : now();

        $dailyJoins = DB::table('team_members')
            ->where('team_id', $teamId)
            ->where('status', 'active')
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('DATE(created_at) as date, COUNT(*) as joins')
            ->groupByRaw('DATE(created_at)')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $result = [];
        $period = $from->toPeriod($to, '1 day');

        foreach ($period as $day) {
            $dateStr = $day->format('Y-m-d');
            $result[] = [
                'date' => $dateStr,
                'new' => $dailyJoins[$dateStr]?->joins ?? 0,
            ];
        }

        $totalJoins = array_sum(array_column($result, 'new'));
        $prevPeriodJoins = DB::table('team_members')
            ->where('team_id', $teamId)
            ->where('status', 'active')
            ->whereBetween('created_at', [$from->copy()->subDays($from->diffInDays($to)), $from])
            ->count();

        $trend = $prevPeriodJoins > 0
            ? round((($totalJoins - $prevPeriodJoins) / $prevPeriodJoins) * 100, 1)
            : null;

        return [
            'stat' => [
                'value' => $totalJoins,
                'label' => 'New Members',
                'icon' => 'UserPlus',
                'trend' => $trend !== null ? [
                    'value' => abs($trend),
                    'direction' => $trend > 0 ? 'up' : ($trend < 0 ? 'down' : 'flat'),
                    'label' => 'vs previous period',
                ] : null,
            ],
            'chart' => [
                'type' => 'bar',
                'data' => $result,
                'config' => ['new' => ['label' => 'New Members', 'color' => 'var(--chart-4)']],
                'xAxisKey' => 'date',
                'dataKeys' => ['new'],
            ],
        ];
    }

    /**
     * Most performed audit actions.
     * Cross-references: audit_logs grouped by action
     */
    private function topActionsData(int $teamId, ?string $dateFrom, ?string $dateTo): array
    {
        $query = AuditLog::where('team_id', $teamId)
            ->select('action', DB::raw('COUNT(*) as count'))
            ->groupBy('action')
            ->orderByDesc('count')
            ->limit(10);

        if ($dateFrom) {
            $query->where('created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->where('created_at', '<=', $dateTo);
        }

        $topActions = $query->get();

        $total = $topActions->sum('count');
        $uniqueActions = $topActions->count();

        return [
            'stat' => [
                'value' => $uniqueActions,
                'label' => 'Unique Actions',
                'icon' => 'Zap',
                'trend' => $total > 0 ? [
                    'value' => $total,
                    'direction' => 'up',
                    'label' => 'total events',
                ] : null,
            ],
            'table' => [
                'columns' => [
                    ['key' => 'action', 'label' => 'Action'],
                    ['key' => 'count', 'label' => 'Count', 'type' => 'number'],
                ],
                'rows' => $topActions->map(fn ($a) => [
                    'id' => $a->action,
                    'action' => $a->action,
                    'count' => $a->count,
                ])->all(),
            ],
            'items' => $topActions->map(fn ($a) => [
                'id' => $a->action,
                'action' => $a->action,
                'count' => $a->count,
            ])->all(),
        ];
    }

    /**
     * Unique IPs, devices and access patterns.
     * Cross-references: sessions + team_members for security insights
     */
    private function securityOverviewData(int $teamId): array
    {
        $teamUserIds = DB::table('team_members')
            ->where('team_id', $teamId)
            ->where('status', 'active')
            ->pluck('user_id')
            ->all();

        $sessions = DB::table('sessions')
            ->whereIn('user_id', $teamUserIds)
            ->get();

        $uniqueIps = $sessions->pluck('ip_address')->filter()->unique()->count();
        $uniqueDevices = $sessions->count();
        $activeNow = $sessions->where('last_activity', '>=', now()->subMinutes(5)->timestamp)->count();

        $last24h = $sessions->where('last_activity', '>=', now()->subHours(24)->timestamp);
        $recentIps = $last24h->pluck('ip_address')->filter()->unique()->count();

        return [
            'stat' => [
                'value' => $uniqueIps,
                'label' => 'Unique IPs',
                'icon' => 'ShieldCheck',
                'trend' => $activeNow > 0 ? [
                    'value' => $activeNow,
                    'direction' => 'up',
                    'label' => 'active now',
                ] : null,
            ],
            'stat2' => [
                'value' => $uniqueDevices,
                'label' => 'Sessions',
            ],
            'stat3' => [
                'value' => $recentIps,
                'label' => 'IPs (24h)',
            ],
        ];
    }

    /**
     * Distribution of notifications by type/category.
     * Cross-references: notifications grouped by type
     */
    private function notificationTypesData(int $teamId, ?string $dateFrom, ?string $dateTo): array
    {
        $query = DB::table('notifications')->where('team_id', $teamId);

        if ($dateFrom) {
            $query->where('created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->where('created_at', '<=', $dateTo);
        }

        $byType = (clone $query)
            ->select('type', DB::raw('COUNT(*) as count'))
            ->groupBy('type')
            ->orderByDesc('count')
            ->get();

        $total = $byType->sum('count');

        $readByType = DB::table('notifications')
            ->where('team_id', $teamId)
            ->when($dateFrom, fn ($q) => $q->where('created_at', '>=', $dateFrom))
            ->when($dateTo, fn ($q) => $q->where('created_at', '<=', $dateTo))
            ->select('type', DB::raw('COUNT(*) as count'), DB::raw('SUM(CASE WHEN read_at IS NOT NULL THEN 1 ELSE 0 END) as read_count'))
            ->groupBy('type')
            ->get()
            ->keyBy('type');

        $chartData = $byType->map(fn ($t) => [
            'type' => class_basename($t->type),
            'total' => $t->count,
            'read' => $readByType[$t->type]?->read_count ?? 0,
            'unread' => $t->count - ($readByType[$t->type]?->read_count ?? 0),
        ])->all();

        $colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
        $config = [];
        foreach ($byType as $i => $t) {
            $name = class_basename($t->type);
            $config[$name] = ['label' => $name, 'color' => $colors[$i % count($colors)]];
        }

        return [
            'stat' => [
                'value' => $total,
                'label' => 'Notifications',
                'icon' => 'BellRing',
            ],
            'chart' => [
                'type' => 'bar',
                'data' => $chartData,
                'config' => array_merge($config, [
                    'read' => ['label' => 'Read', 'color' => 'var(--chart-2)'],
                    'unread' => ['label' => 'Unread', 'color' => 'var(--chart-5)'],
                ]),
                'xAxisKey' => 'type',
                'dataKeys' => ['read', 'unread'],
                'stacked' => true,
            ],
            'table' => [
                'columns' => [
                    ['key' => 'type', 'label' => 'Type'],
                    ['key' => 'total', 'label' => 'Total', 'type' => 'number'],
                    ['key' => 'read', 'label' => 'Read', 'type' => 'number'],
                ],
                'rows' => $chartData,
            ],
        ];
    }
}
