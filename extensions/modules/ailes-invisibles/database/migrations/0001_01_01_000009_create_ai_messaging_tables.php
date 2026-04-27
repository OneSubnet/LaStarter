<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->string('title')->nullable();
            $table->string('type')->default('direct'); // direct, group
            $table->string('created_by_type'); // user, client
            $table->unsignedBigInteger('created_by_id');
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['team_id', 'last_message_at']);
        });

        Schema::create('ai_conversation_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('ai_conversations')->cascadeOnDelete();
            $table->string('participant_type'); // user, client
            $table->unsignedBigInteger('participant_id');
            $table->string('role')->default('member'); // admin, member
            $table->timestamp('joined_at');
            $table->timestamps();

            $table->unique(['conversation_id', 'participant_type', 'participant_id']);
        });

        Schema::create('ai_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('ai_conversations')->cascadeOnDelete();
            $table->string('sender_type'); // user, client
            $table->unsignedBigInteger('sender_id');
            $table->text('encrypted_content');
            $table->string('iv');
            $table->string('type')->default('text'); // text, file, system
            $table->string('file_path')->nullable();
            $table->timestamp('edited_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['conversation_id', 'created_at']);
        });

        Schema::create('ai_message_encrypted_keys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')->constrained('ai_messages')->cascadeOnDelete();
            $table->string('participant_type'); // user, client
            $table->unsignedBigInteger('participant_id');
            $table->text('encrypted_key');
            $table->timestamps();

            $table->unique(['message_id', 'participant_type', 'participant_id']);
        });

        Schema::create('ai_message_read_receipts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')->constrained('ai_messages')->cascadeOnDelete();
            $table->string('reader_type'); // user, client
            $table->unsignedBigInteger('reader_id');
            $table->timestamp('read_at');
            $table->timestamps();

            $table->unique(['message_id', 'reader_type', 'reader_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_message_read_receipts');
        Schema::dropIfExists('ai_message_encrypted_keys');
        Schema::dropIfExists('ai_messages');
        Schema::dropIfExists('ai_conversation_participants');
        Schema::dropIfExists('ai_conversations');
    }
};
