<?php

namespace Modules\AilesInvisibles\Models;

use App\Concerns\HasTeam;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use HasFactory, HasTeam, SoftDeletes;

    protected $table = 'ai_invoices';

    protected $fillable = [
        'team_id',
        'client_id',
        'quote_id',
        'event_id',
        'invoice_number',
        'status',
        'issue_date',
        'due_date',
        'paid_at',
        'subtotal',
        'tax_amount',
        'total',
        'paid_amount',
        'notes',
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
            'issue_date' => 'date',
            'due_date' => 'date',
            'paid_at' => 'datetime',
            'subtotal' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'metadata' => 'array',
        ];
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function quote()
    {
        return $this->belongsTo(Quote::class);
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function lines()
    {
        return $this->hasMany(InvoiceLine::class)->orderBy('sort_order');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
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

    public function recalculate(): void
    {
        $subtotal = $this->lines->sum('line_total');
        $taxAmount = $this->lines->sum(fn ($line) => $line->line_total * ($line->tax_rate / 100));
        $paidAmount = $this->payments->sum('amount');

        $this->update([
            'subtotal' => round($subtotal, 2),
            'tax_amount' => round($taxAmount, 2),
            'total' => round($subtotal + $taxAmount, 2),
            'paid_amount' => round($paidAmount, 2),
        ]);
    }
}
