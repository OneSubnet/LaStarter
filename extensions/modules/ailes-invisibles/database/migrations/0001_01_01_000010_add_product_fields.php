<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_products', function (Blueprint $table) {
            $table->string('reference')->nullable()->after('sku');
            $table->string('image_path')->nullable()->after('description');
            $table->integer('stock')->nullable()->after('unit');
            $table->integer('stock_alert')->nullable()->after('stock');
        });
    }

    public function down(): void
    {
        Schema::table('ai_products', function (Blueprint $table) {
            $table->dropColumn(['reference', 'image_path', 'stock', 'stock_alert']);
        });
    }
};
