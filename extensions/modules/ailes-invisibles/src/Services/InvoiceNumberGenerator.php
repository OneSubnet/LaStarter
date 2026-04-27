<?php

namespace Modules\AilesInvisibles\Services;

use Illuminate\Support\Facades\DB;
use Modules\AilesInvisibles\Models\Invoice;

class InvoiceNumberGenerator
{
    public function generate(int $teamId): string
    {
        return DB::transaction(function () use ($teamId) {
            $year = now()->format('Y');

            $last = Invoice::withTrashed()
                ->where('team_id', $teamId)
                ->where('invoice_number', 'like', "FAC-{$year}-%")
                ->lockForUpdate()
                ->orderByDesc('id')
                ->first();

            $sequence = 1;
            if ($last) {
                $parts = explode('-', $last->invoice_number);
                $sequence = (int) end($parts) + 1;
            }

            return "FAC-{$year}-".str_pad($sequence, 4, '0', STR_PAD_LEFT);
        });
    }
}
