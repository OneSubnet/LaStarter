<?php

namespace Modules\AilesInvisibles\Models;

use App\Concerns\HasTeam;
use Illuminate\Database\Eloquent\Model;

class Account extends Model
{
    use HasTeam;

    protected $table = 'ai_accounts';

    protected $fillable = [
        'team_id',
        'name',
        'type',
        'code',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    public function journalEntryLines()
    {
        return $this->hasMany(JournalEntryLine::class);
    }
}
