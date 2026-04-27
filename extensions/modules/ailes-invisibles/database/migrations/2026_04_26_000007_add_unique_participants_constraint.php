<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Delete duplicate participants (keep the earliest one)
        $duplicates = DB::table('ai_conversation_participants')
            ->select('conversation_id', 'participant_type', 'participant_id', DB::raw('MIN(id) as keep_id'))
            ->groupBy('conversation_id', 'participant_type', 'participant_id')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicates as $dup) {
            DB::table('ai_conversation_participants')
                ->where('conversation_id', $dup->conversation_id)
                ->where('participant_type', $dup->participant_type)
                ->where('participant_id', $dup->participant_id)
                ->where('id', '!=', $dup->keep_id)
                ->delete();
        }

        Schema::table('ai_conversation_participants', function (Blueprint $table) {
            $table->unique(['conversation_id', 'participant_type', 'participant_id'], 'conv_participant_unique');
        });
    }

    public function down(): void
    {
        Schema::table('ai_conversation_participants', function (Blueprint $table) {
            $table->dropUnique('conv_participant_unique');
        });
    }
};
