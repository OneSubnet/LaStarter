<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('ai_clients')->cascadeOnDelete();
            $table->foreignId('quote_id')->nullable()->constrained('ai_quotes')->nullOnDelete();
            $table->foreignId('event_id')->nullable()->constrained('ai_events')->nullOnDelete();
            $table->string('invoice_number');
            $table->string('status')->default('draft'); // draft, sent, viewed, paid, partial, overdue, cancelled
            $table->date('issue_date');
            $table->date('due_date');
            $table->timestamp('paid_at')->nullable();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->text('notes')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['team_id', 'invoice_number']);
            $table->index(['team_id', 'status']);
        });

        Schema::create('ai_invoice_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('ai_invoices')->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('ai_products')->nullOnDelete();
            $table->text('description');
            $table->decimal('quantity', 10, 2)->default(1);
            $table->decimal('unit_price', 10, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(20.00);
            $table->decimal('line_total', 12, 2)->default(0);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('ai_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->foreignId('invoice_id')->constrained('ai_invoices')->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->string('method'); // card, transfer, check, cash, other
            $table->string('reference')->nullable();
            $table->timestamp('paid_at');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['team_id', 'invoice_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_payments');
        Schema::dropIfExists('ai_invoice_lines');
        Schema::dropIfExists('ai_invoices');
    }
};
