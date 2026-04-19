<?php

namespace App\Actions\Members;

use App\Core\Audit\AuditLogger;
use App\Models\Team;
use App\Models\User;
use Spatie\Permission\PermissionRegistrar;

class UpdateTeamMemberRole
{
    public function __construct(private AuditLogger $audit) {}

    public function handle(Team $team, User $member, string $role): void
    {
        $team->memberships()
            ->where('user_id', $member->id)
            ->firstOrFail()
            ->update(['role' => $role]);

        app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);
        $member->syncRoles([$role]);

        $this->audit->log('member.role_updated', $team, ['member_id' => $member->id, 'new_role' => $role]);
    }
}
