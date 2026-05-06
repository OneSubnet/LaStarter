<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('extensions', function (Blueprint $table) {
            $table->json('dependencies')->nullable();
            $table->string('minimum_core_version', 32)->nullable();
            $table->json('provides')->nullable();
            $table->json('widgets')->nullable();
            $table->json('metrics')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('extensions', function (Blueprint $table) {
            $table->dropColumn([
                'dependencies',
                'minimum_core_version',
                'provides',
                'widgets',
                'metrics',
            ]);
        });
    }
};
