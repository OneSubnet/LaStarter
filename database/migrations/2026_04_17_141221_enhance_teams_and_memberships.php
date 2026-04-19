<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('is_personal');
        });

        Schema::table('team_members', function (Blueprint $table) {
            $table->string('status')->default('active')->after('role');
            $table->timestamp('joined_at')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('team_members', function (Blueprint $table) {
            $table->dropColumn(['status', 'joined_at']);
        });

        Schema::table('teams', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });
    }
};
