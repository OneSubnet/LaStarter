<?php

namespace App\Actions\Members;

use App\Core\Audit\AuditLogger;
use App\Models\Team;
use App\Models\User;
use Spatie\Permission\PermissionRegistrar;

class RemoveTeamMember
{
    public function __construct(private AuditLogger $audit) {}

    public function handle(Team $team, User $member): void
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($team->id);
        $member->syncRoles([]);

        $team->memberships()
            ->where('user_id', $member->id)
            ->delete();

        $this->audit->log('member.removed', $team, ['removed_user_id' => $member->id, 'removed_email' => $member->email]);

        if ($member->isCurrentTeam($team)) {
            $member->switchTeam($member->personalTeam());
        }
    }
}
