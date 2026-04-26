<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_client_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('ai_clients')->cascadeOnDelete();
            $table->string('email')->unique();
            $table->string('password');
            $table->string('name');
            $table->string('access_token')->nullable()->unique();
            $table->text('public_key')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->rememberToken();
            $table->timestamps();

            $table->index(['team_id', 'client_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_client_users');
    }
};
