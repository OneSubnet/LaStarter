<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('team_members', function (Blueprint $table) {
            $table->index('role');
        });

        Schema::table('team_invitations', function (Blueprint $table) {
            $table->index('expires_at');
            $table->index('accepted_at');
            $table->index('invited_by');
        });
    }

    public function down(): void
    {
        Schema::table('team_members', function (Blueprint $table) {
            $table->dropIndex(['role']);
        });

        Schema::table('team_invitations', function (Blueprint $table) {
            $table->dropIndex(['expires_at']);
            $table->dropIndex(['accepted_at']);
            $table->dropIndex(['invited_by']);
        });
    }
};
