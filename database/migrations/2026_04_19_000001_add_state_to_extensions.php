<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('extensions', function (Blueprint $table) {
            $table->string('state')->default('not_installed')->after('is_active');
            $table->text('error_message')->nullable()->after('state');
            $table->string('author')->nullable()->after('error_message');
            $table->string('update_url')->nullable()->after('author');
            $table->string('lastarter_version')->nullable()->after('update_url');
            $table->timestamp('installed_at')->nullable()->after('lastarter_version');
        });

        // Convert existing rows: is_active=true → state='enabled'
        DB::table('extensions')->where('is_active', true)->update(['state' => 'enabled']);
        DB::table('extensions')->where('is_active', false)->update(['state' => 'not_installed']);

        Schema::table('team_extensions', function (Blueprint $table) {
            $table->string('state')->default('disabled')->after('is_active');
        });

        // Convert team_extensions: is_active=true → state='enabled'
        DB::table('team_extensions')->where('is_active', true)->update(['state' => 'enabled']);
    }

    public function down(): void
    {
        Schema::table('extensions', function (Blueprint $table) {
            $table->dropColumn(['state', 'error_message', 'author', 'update_url', 'lastarter_version', 'installed_at']);
        });

        Schema::table('team_extensions', function (Blueprint $table) {
            $table->dropColumn('state');
        });
    }
};
