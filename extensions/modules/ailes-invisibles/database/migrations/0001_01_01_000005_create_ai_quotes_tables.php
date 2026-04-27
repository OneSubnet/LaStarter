<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_quotes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('ai_clients')->cascadeOnDelete();
            $table->foreignId('event_id')->nullable()->constrained('ai_events')->nullOnDelete();
            $table->string('quote_number');
            $table->string('status')->default('draft'); // draft, sent, viewed, accepted, rejected, expired, converted
            $table->string('subject')->nullable();
            $table->text('notes')->nullable();
            $table->date('valid_until')->nullable();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['team_id', 'quote_number']);
            $table->index(['team_id', 'status']);
        });

        Schema::create('ai_quote_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quote_id')->constrained('ai_quotes')->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('ai_products')->nullOnDelete();
            $table->text('description');
            $table->decimal('quantity', 10, 2)->default(1);
            $table->decimal('unit_price', 10, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(20.00);
            $table->decimal('line_total', 12, 2)->default(0);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_quote_lines');
        Schema::dropIfExists('ai_quotes');
    }
};
