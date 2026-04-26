<?php

namespace Modules\AilesInvisibles\Models;

use App\Concerns\HasTeam;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Quote extends Model
{
    use HasTeam, SoftDeletes;

    protected $table = 'ai_quotes';

    protected $fillable = [
        'team_id',
        'client_id',
        'event_id',
        'quote_number',
        'status',
        'subject',
        'notes',
        'valid_until',
        'subtotal',
        'tax_amount',
        'total',
        'metadata',
        'file_path',
        'file_name',
        'file_size',
        'version',
        'previous_version_id',
    ];

    protected function casts(): array
    {
        return [
            'valid_until' => 'date',
            'subtotal' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total' => 'decimal:2',
            'metadata' => 'array',
        ];
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function lines()
    {
        return $this->hasMany(QuoteLine::class)->orderBy('sort_order');
    }

    public function previousVersion()
    {
        return $this->belongsTo(self::class, 'previous_version_id');
    }

    public function nextVersions()
    {
        return $this->hasMany(self::class, 'previous_version_id');
    }

    public function hasFile(): bool
    {
        return ! empty($this->file_path);
    }

    public function invoice()
    {
        return $this->hasOne(Invoice::class);
    }

    public function recalculate(): void
    {
        $subtotal = $this->lines->sum('line_total');
        $taxAmount = $this->lines->sum(fn ($line) => $line->line_total * ($line->tax_rate / 100));

        $this->update([
            'subtotal' => round($subtotal, 2),
            'tax_amount' => round($taxAmount, 2),
            'total' => round($subtotal + $taxAmount, 2),
        ]);
    }
}
