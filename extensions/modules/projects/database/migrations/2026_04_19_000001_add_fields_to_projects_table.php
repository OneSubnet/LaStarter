<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('priority')->default('medium')->after('status');
            $table->date('due_date')->nullable()->after('priority');
            $table->string('color')->nullable()->after('due_date');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['priority', 'due_date', 'color']);
        });
    }
};
