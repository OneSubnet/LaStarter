<?php

namespace App\Http\Controllers\Settings;

use App\Core\Audit\AuditLogger;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class AuditController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:audit.view');
    }

    public function index(Request $request): Response
    {
        $teamId = $request->user()->current_team_id;

        $query = AuditLog::where('team_id', $teamId)
            ->with('user');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                    ->orWhere('module', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%"))
                    ->orWhere('subject_type', 'like', "%{$search}%");
            });
        }

        if ($action = $request->query('action')) {
            $query->where('action', $action);
        }

        if ($module = $request->query('module')) {
            $query->where('module', $module);
        }

        if ($userId = $request->query('user_id')) {
            $query->where('user_id', (int) $userId);
        }

        if ($from = $request->query('from')) {
            $query->where('created_at', '>=', $from);
        }

        if ($to = $request->query('to')) {
            $query->where('created_at', '<=', $to);
        }

        $sort = $request->query('sort', 'created_at');
        $direction = $request->query('direction', 'desc');

        if (in_array($sort, ['created_at', 'action', 'module'])) {
            $query->orderBy($sort, $direction === 'asc' ? 'asc' : 'desc');
        }

        $logs = $query->paginate(25)
            ->through(fn (AuditLog $log) => [
                'id' => $log->id,
                'user' => $log->user?->name,
                'action' => $log->action,
                'module' => $log->module,
                'subject_type' => $log->subject_type,
                'subject_id' => $log->subject_id,
                'properties' => $log->properties,
                'ip_address' => $log->ip_address,
                'trace_id' => $log->trace_id,
                'created_at' => $log->created_at?->toISOString(),
            ]);

        $actions = AuditLog::where('team_id', $teamId)
            ->distinct()
            ->pluck('action')
            ->sort()
            ->values();

        $modules = AuditLog::where('team_id', $teamId)
            ->distinct()
            ->pluck('module')
            ->filter()
            ->sort()
            ->values();

        $teamMembers = $request->user()->currentTeam
            ->members()
            ->wherePivot('status', 'active')
            ->get()
            ->map(fn ($m) => ['id' => $m->id, 'name' => $m->name]);

        return Inertia::render('settings/audit', [
            'logs' => $logs,
            'filters' => [
                'search' => $search,
                'action' => $action,
                'module' => $module,
                'user_id' => $userId ? (int) $userId : null,
                'from' => $from,
                'to' => $to,
                'sort' => $sort,
                'direction' => $direction,
            ],
            'actions' => $actions,
            'modules' => $modules,
            'teamMembers' => $teamMembers,
        ]);
    }

    public function export(Request $request): JsonResponse
    {
        $teamId = $request->user()->current_team_id;

        $query = AuditLog::where('team_id', $teamId)->with('user');

        if ($from = $request->query('from')) {
            $query->where('created_at', '>=', $from);
        }

        if ($to = $request->query('to')) {
            $query->where('created_at', '<=', $to);
        }

        $logs = $query->latest('created_at')->limit(5000)->get();

        return response()->json([
            'logs' => $logs->map(fn (AuditLog $log) => [
                'id' => $log->id,
                'user' => $log->user?->name,
                'action' => $log->action,
                'module' => $log->module,
                'subject_type' => $log->subject_type,
                'subject_id' => $log->subject_id,
                'properties' => $log->properties,
                'ip_address' => $log->ip_address,
                'trace_id' => $log->trace_id,
                'created_at' => $log->created_at?->toISOString(),
            ]),
        ]);
    }

    public function log(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'action' => 'required|string|max:255',
            'module' => 'nullable|string|max:255',
            'properties' => 'nullable|array',
        ]);

        app(AuditLogger::class)->log(
            action: $validated['action'],
            properties: $validated['properties'] ?? [],
            module: $validated['module'] ?? null,
        );

        return back();
    }
}
