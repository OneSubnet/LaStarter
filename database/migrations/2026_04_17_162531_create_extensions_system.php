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
        Schema::create('extensions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('identifier')->unique();
            $table->enum('type', ['module', 'theme']);
            $table->string('version', 50)->nullable();
            $table->text('description')->nullable();
            $table->string('path');
            $table->string('provider_class')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('manifest_json')->nullable();
            $table->timestamps();
        });

        Schema::create('team_extensions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->foreignId('extension_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_active')->default(false);
            $table->json('settings')->nullable();
            $table->timestamps();

            $table->unique(['team_id', 'extension_id']);
        });

        Schema::create('team_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->string('key');
            $table->text('value')->nullable();
            $table->timestamps();

            $table->unique(['team_id', 'key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('team_settings');
        Schema::dropIfExists('team_extensions');
        Schema::dropIfExists('extensions');
    }
};
