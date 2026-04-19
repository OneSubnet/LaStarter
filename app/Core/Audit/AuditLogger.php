<?php

namespace App\Core\Audit;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class AuditLogger
{
    public function log(string $action, ?Model $subject = null, array $properties = [], ?string $module = null): AuditLog
    {
        $user = Auth::user();
        $request = $this->resolveRequest();

        return AuditLog::create([
            'team_id' => $user?->current_team_id,
            'user_id' => $user?->id,
            'action' => $action,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id' => $subject?->getKey(),
            'properties' => ! empty($properties) ? $properties : null,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'trace_id' => $request?->header('X-Trace-ID') ?? Str::uuid()->toString(),
            'module' => $module,
        ]);
    }

    protected function resolveRequest(): ?Request
    {
        try {
            return app(Request::class);
        } catch (\Throwable) {
            return null;
        }
    }
}
