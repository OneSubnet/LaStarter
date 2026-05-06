<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('extensions', function (Blueprint $table) {
            $table->id();
            $table->string('identifier')->unique();
            $table->string('name');
            $table->enum('type', ['module', 'theme', 'language'])->default('module');
            $table->string('version')->nullable();
            $table->text('description')->nullable();
            $table->string('author')->nullable();
            $table->string('provider_class')->nullable();
            $table->string('namespace')->nullable();
            $table->json('permissions')->nullable();
            $table->json('navigation')->nullable();
            $table->json('settings')->nullable();
            $table->string('path')->nullable();
            $table->string('state')->nullable();
            $table->timestamps();

            $table->index('type');
            $table->index('state');
        });

        Schema::create('team_extensions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('extension_id')->constrained()->cascadeOnDelete();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_active')->default(false);
            $table->unique(['extension_id', 'team_id']);
            $table->timestamps();

            $table->index('team_id');
            $table->index('extension_id');
            $table->index(['team_id', 'is_active']);
        });

        Schema::create('team_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->string('key');
            $table->text('value')->nullable();
            $table->unique(['team_id', 'key']);

            $table->index(['team_id', 'key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('team_settings');
        Schema::dropIfExists('team_extensions');
        Schema::dropIfExists('extensions');
    }
};
