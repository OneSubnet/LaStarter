<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spaces', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('visibility')->default('restricted'); // public, restricted, private
            $table->json('settings')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['team_id', 'slug']);
        });

        Schema::create('space_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('space_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role')->default('member'); // admin, member, viewer
            $table->json('permissions')->nullable(); // override space-level permissions
            $table->timestamp('joined_at')->nullable();
            $table->timestamps();

            $table->unique(['space_id', 'user_id']);
        });

        Schema::create('space_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('space_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // uploader
            $table->string('name');
            $table->string('file_path');
            $table->string('file_type')->nullable();
            $table->unsignedInteger('file_size')->default(0);
            $table->string('status')->default('uploaded'); // uploaded, pending_signature, signed, expired
            $table->boolean('requires_signature')->default(false);
            $table->text('instructions')->nullable(); // what's expected from the user
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['space_id', 'status']);
        });

        Schema::create('space_document_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('space_documents')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('action')->default('review'); // review, sign, download
            $table->string('status')->default('pending'); // pending, completed, rejected
            $table->timestamp('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['document_id', 'user_id', 'action']);
        });

        Schema::create('space_document_signatures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('space_documents')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('signature_data')->nullable(); // base64 or hash
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamp('signed_at');
            $table->timestamps();

            $table->index(['document_id', 'user_id']);
        });

        Schema::create('space_activity_log', function (Blueprint $table) {
            $table->id();
            $table->foreignId('space_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action'); // document.uploaded, document.signed, member.joined, etc.
            $table->string('subject_type')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->json('properties')->nullable();
            $table->timestamps();

            $table->index(['space_id', 'created_at']);
        });

        Schema::create('space_deletion_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('reason')->nullable();
            $table->string('status')->default('pending'); // pending, approved, rejected, cancelled
            $table->timestamp('hold_until')->nullable(); // block deletion until contract ends
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['team_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('space_deletion_requests');
        Schema::dropIfExists('space_activity_log');
        Schema::dropIfExists('space_document_signatures');
        Schema::dropIfExists('space_document_assignments');
        Schema::dropIfExists('space_documents');
        Schema::dropIfExists('space_members');
        Schema::dropIfExists('spaces');
    }
};
