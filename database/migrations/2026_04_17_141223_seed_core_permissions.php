<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $permissions = [
            // Team management
            'team.update',
            'team.delete',

            // Member management
            'member.view',
            'member.add',
            'member.update',
            'member.remove',

            // Invitation management
            'invitation.create',
            'invitation.cancel',

            // Role management
            'role.view',
            'role.create',
            'role.update',
            'role.delete',

            // Module management
            'module.view',
            'module.update',
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->insert([
                'name' => $permission,
                'guard_name' => 'web',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('permissions')->whereIn('name', [
            'team.update', 'team.delete',
            'member.view', 'member.add', 'member.update', 'member.remove',
            'invitation.create', 'invitation.cancel',
            'role.view', 'role.create', 'role.update', 'role.delete',
            'module.view', 'module.update',
        ])->delete();
    }
};
