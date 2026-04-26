<?php

namespace Modules\AilesInvisibles\Models;

use App\Concerns\HasTeam;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasTeam;

    protected $table = 'ai_payments';

    protected $fillable = [
        'team_id',
        'invoice_id',
        'amount',
        'method',
        'reference',
        'paid_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}
