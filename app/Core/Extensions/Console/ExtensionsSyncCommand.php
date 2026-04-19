<?php

namespace App\Core\Extensions\Console;

use App\Core\Extensions\ExtensionManager;
use App\Models\Extension;
use Illuminate\Console\Command;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class ExtensionsSyncCommand extends Command
{
    protected $signature = 'extensions:sync {--prune : Remove orphaned permissions}';

    protected $description = 'Sync permissions from extension manifests to Spatie';

    public function handle(ExtensionManager $manager): int
    {
        $extensions = $manager->all()->filter(fn (Extension $ext) => $ext->is_active);

        $synced = 0;
        $allPermissionNames = [];

        foreach ($extensions as $extension) {
            $manifest = $extension->manifest();

            if (! $manifest || empty($manifest->permissions)) {
                continue;
            }

            foreach ($manifest->permissions as $permissionName) {
                Permission::firstOrCreate(
                    ['name' => $permissionName, 'guard_name' => 'web'],
                );
                $allPermissionNames[] = $permissionName;
                $synced++;
            }
        }

        $this->info("Synced {$synced} permissions from extensions.");

        // Ensure owner roles have all permissions
        $allPermissions = Permission::where('guard_name', 'web')->get();
        Role::where('name', 'owner')->each(function (Role $role) use ($allPermissions) {
            $role->syncPermissions($allPermissions);
        });

        $this->info('Owner roles updated with all permissions.');

        // Prune orphaned permissions
        if ($this->option('prune')) {
            $orphaned = Permission::where('guard_name', 'web')
                ->whereNotIn('name', $allPermissionNames)
                ->whereNotIn('name', [
                    'team.update', 'team.delete',
                    'member.view', 'member.add', 'member.update', 'member.remove',
                    'invitation.create', 'invitation.cancel',
                    'role.view', 'role.create', 'role.update', 'role.delete',
                    'module.view', 'module.update',
                ])
                ->delete();

            if ($orphaned > 0) {
                $this->warn("Pruned {$orphaned} orphaned permissions.");
            }
        }

        return self::SUCCESS;
    }
}
