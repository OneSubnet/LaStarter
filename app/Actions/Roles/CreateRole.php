<?php

namespace App\Actions\Roles;

use App\Core\Audit\AuditLogger;
use Spatie\Permission\Models\Role;

class CreateRole
{
    public function __construct(private AuditLogger $audit) {}

    public function handle(int $teamId, string $name, array $permissions = []): Role
    {
        $role = Role::create([
            'name' => $name,
            'team_id' => $teamId,
            'guard_name' => 'web',
        ]);

        if (! empty($permissions)) {
            $role->syncPermissions($permissions);
        }

        $this->audit->log('role.created', $role, ['name' => $name, 'permissions' => $permissions]);

        return $role;
    }
}
