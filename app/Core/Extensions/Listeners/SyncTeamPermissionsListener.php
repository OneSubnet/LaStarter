<?php

namespace App\Core\Extensions\Listeners;

use App\Core\Extensions\Events\ExtensionEnabled;
use App\Enums\TeamRole;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

final class SyncTeamPermissionsListener
{
    public function handle(ExtensionEnabled $event): void
    {
        $permissions = $event->manifest->permissions;

        if ($permissions === []) {
            return;
        }

        $models = Permission::whereIn('name', $permissions)
            ->where('guard_name', 'web')
            ->get();

        $this->syncRole(TeamRole::Owner->value, $event->teamId, $models);
        $this->syncRole(TeamRole::Admin->value, $event->teamId, $models);
    }

    private function syncRole(string $roleName, int $teamId, $permissions): void
    {
        $role = Role::where('name', $roleName)
            ->where('team_id', $teamId)
            ->first();

        $role?->givePermissionTo($permissions);
    }
}
