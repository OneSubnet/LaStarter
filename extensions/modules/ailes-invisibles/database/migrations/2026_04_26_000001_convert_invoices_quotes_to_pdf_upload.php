<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_invoices', function (Blueprint $table) {
            $table->string('file_path')->nullable()->after('metadata');
            $table->string('file_name')->nullable()->after('file_path');
            $table->unsignedBigInteger('file_size')->nullable()->after('file_name');
            $table->unsignedInteger('version')->default(1)->after('file_size');
            $table->foreignId('previous_version_id')->nullable()->after('version')->constrained('ai_invoices')->nullOnDelete();
        });

        Schema::table('ai_quotes', function (Blueprint $table) {
            $table->string('file_path')->nullable()->after('metadata');
            $table->string('file_name')->nullable()->after('file_path');
            $table->unsignedBigInteger('file_size')->nullable()->after('file_name');
            $table->unsignedInteger('version')->default(1)->after('file_size');
            $table->foreignId('previous_version_id')->nullable()->after('version')->constrained('ai_quotes')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('ai_quotes', function (Blueprint $table) {
            $table->dropForeign(['previous_version_id']);
            $table->dropColumn(['file_path', 'file_name', 'file_size', 'version', 'previous_version_id']);
        });

        Schema::table('ai_invoices', function (Blueprint $table) {
            $table->dropForeign(['previous_version_id']);
            $table->dropColumn(['file_path', 'file_name', 'file_size', 'version', 'previous_version_id']);
        });
    }
};
