<?php

namespace App\Actions\Roles;

use App\Core\Audit\AuditLogger;
use Spatie\Permission\Models\Role;

class DeleteRole
{
    public function __construct(private AuditLogger $audit) {}

    public function handle(Role $role): void
    {
        $this->audit->log('role.deleted', $role, ['name' => $role->name]);

        $role->delete();
    }
}
