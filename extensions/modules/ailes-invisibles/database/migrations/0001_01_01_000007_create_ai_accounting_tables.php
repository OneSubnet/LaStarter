<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('type'); // revenue, expense, asset, liability
            $table->string('code')->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->unique(['team_id', 'code']);
        });

        Schema::create('ai_journal_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->string('description')->nullable();
            $table->string('reference_type')->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->timestamps();

            $table->index(['team_id', 'date']);
        });

        Schema::create('ai_journal_entry_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('journal_entry_id')->constrained('ai_journal_entries')->cascadeOnDelete();
            $table->foreignId('account_id')->constrained('ai_accounts')->cascadeOnDelete();
            $table->decimal('debit', 12, 2)->default(0);
            $table->decimal('credit', 12, 2)->default(0);
            $table->string('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_journal_entry_lines');
        Schema::dropIfExists('ai_journal_entries');
        Schema::dropIfExists('ai_accounts');
    }
};
