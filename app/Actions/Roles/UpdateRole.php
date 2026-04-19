<?php

namespace App\Actions\Roles;

use App\Core\Audit\AuditLogger;
use Spatie\Permission\Models\Role;

class UpdateRole
{
    public function __construct(private AuditLogger $audit) {}

    public function handle(Role $role, string $name, ?array $permissions = null): void
    {
        $role->update(['name' => $name]);

        if ($permissions !== null) {
            $role->syncPermissions($permissions);
        }

        $this->audit->log('role.updated', $role, ['name' => $name, 'permissions' => $permissions]);
    }
}
