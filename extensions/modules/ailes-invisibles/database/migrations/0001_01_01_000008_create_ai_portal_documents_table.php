<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_portal_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('ai_clients')->cascadeOnDelete();
            $table->foreignId('uploaded_by')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->string('file_path');
            $table->string('file_type')->nullable();
            $table->unsignedInteger('file_size')->default(0);
            $table->string('category')->nullable(); // contrat, facture, devis, autre
            $table->string('status')->default('uploaded'); // uploaded, pending_signature, signed, expired
            $table->boolean('requires_signature')->default(false);
            $table->text('instructions')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['team_id', 'client_id']);
            $table->index(['client_id', 'status']);
        });

        Schema::create('ai_document_signatures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('ai_portal_documents')->cascadeOnDelete();
            $table->string('signer_type'); // client, admin
            $table->unsignedBigInteger('signer_id');
            $table->text('signature_data')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamp('signed_at');
            $table->timestamps();

            $table->index(['document_id', 'signer_type', 'signer_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_document_signatures');
        Schema::dropIfExists('ai_portal_documents');
    }
};
