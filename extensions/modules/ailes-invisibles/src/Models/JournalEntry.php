<?php

namespace Modules\AilesInvisibles\Models;

use App\Concerns\HasTeam;
use Illuminate\Database\Eloquent\Model;

class JournalEntry extends Model
{
    use HasTeam;

    protected $table = 'ai_journal_entries';

    protected $fillable = [
        'team_id',
        'date',
        'description',
        'reference_type',
        'reference_id',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    public function lines()
    {
        return $this->hasMany(JournalEntryLine::class);
    }
}
