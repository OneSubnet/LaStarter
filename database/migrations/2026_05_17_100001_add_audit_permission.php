<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        $permission = Permission::firstOrCreate(['name' => 'audit.view', 'guard_name' => 'web']);

        $teams = DB::table('teams')->pluck('id');

        foreach ($teams as $teamId) {
            $ownerRole = Role::where('name', 'owner')
                ->where('team_id', $teamId)
                ->first();

            if ($ownerRole && ! $ownerRole->hasPermissionTo($permission)) {
                $ownerRole->givePermissionTo($permission);
            }

            $adminRole = Role::where('name', 'admin')
                ->where('team_id', $teamId)
                ->first();

            if ($adminRole && ! $adminRole->hasPermissionTo($permission)) {
                $adminRole->givePermissionTo($permission);
            }
        }
    }

    public function down(): void
    {
        Permission::where('name', 'audit.view')->delete();
    }
};
