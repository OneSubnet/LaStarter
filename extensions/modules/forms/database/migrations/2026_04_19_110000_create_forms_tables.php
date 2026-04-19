<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('forms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // creator
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('slug')->unique();
            $table->string('status')->default('draft'); // draft, published, closed
            $table->json('settings')->nullable(); // notification, require_login, etc.
            $table->unsignedInteger('responses_count')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['team_id', 'status']);
        });

        Schema::create('form_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('form_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // text, textarea, email, number, select, radio, checkbox, date, file, rating, scale, yes_no
            $table->text('label');
            $table->text('description')->nullable();
            $table->json('options')->nullable(); // for select/radio/checkbox: [{label, value}]
            $table->boolean('required')->default(false);
            $table->unsignedInteger('order')->default(0);
            $table->json('validation')->nullable(); // min, max, pattern, etc.
            $table->timestamps();

            $table->index(['form_id', 'order']);
        });

        Schema::create('form_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('form_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // null for anonymous
            $table->string('status')->default('completed'); // started, completed
            $table->json('responses'); // { question_id: answer }
            $table->timestamps();

            $table->index(['form_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('form_submissions');
        Schema::dropIfExists('form_questions');
        Schema::dropIfExists('forms');
    }
};
