<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Core tables
        Schema::table('team_members', function (Blueprint $table) {
            $table->index('team_id');
            $table->index('user_id');
            $table->index('status');
        });

        Schema::table('team_invitations', function (Blueprint $table) {
            $table->index('team_id');
            $table->index('email');
        });

        // Module tables
        $moduleTables = [
            'projects' => ['team_id', 'status', 'priority'],
            'forms' => ['team_id', 'user_id', 'status'],
            'form_questions' => ['form_id'],
            'form_submissions' => ['form_id', 'user_id'],
            'spaces' => ['team_id'],
            'space_members' => ['space_id', 'user_id'],
            'space_documents' => ['space_id', 'user_id', 'status'],
            'space_document_assignments' => ['document_id', 'user_id'],
            'space_document_signatures' => ['document_id', 'user_id'],
            'space_activity_log' => ['space_id', 'user_id'],
            'space_deletion_requests' => ['team_id', 'user_id', 'reviewed_by'],
        ];

        foreach ($moduleTables as $table => $columns) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $migration) use ($table, $columns) {
                    foreach ($columns as $column) {
                        if (Schema::hasColumn($table, $column)) {
                            $migration->index($column);
                        }
                    }
                });
            }
        }
    }

    public function down(): void
    {
        $allIndexes = [
            'team_members' => ['team_id', 'user_id', 'status'],
            'team_invitations' => ['team_id', 'email'],
            'projects' => ['team_id', 'status', 'priority'],
            'forms' => ['team_id', 'user_id', 'status'],
            'form_questions' => ['form_id'],
            'form_submissions' => ['form_id', 'user_id'],
            'spaces' => ['team_id'],
            'space_members' => ['space_id', 'user_id'],
            'space_documents' => ['space_id', 'user_id', 'status'],
            'space_document_assignments' => ['document_id', 'user_id'],
            'space_document_signatures' => ['document_id', 'user_id'],
            'space_activity_log' => ['space_id', 'user_id'],
            'space_deletion_requests' => ['team_id', 'user_id', 'reviewed_by'],
        ];

        foreach ($allIndexes as $table => $indexes) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $migration) use ($indexes) {
                    foreach ($indexes as $index) {
                        $migration->dropIndex($index);
                    }
                });
            }
        }
    }
};
