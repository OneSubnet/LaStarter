<?php

namespace Modules\AilesInvisibles\Services;

use Modules\AilesInvisibles\Models\Quote;

class QuoteNumberGenerator
{
    public function generate(int $teamId): string
    {
        $year = now()->format('Y');
        $last = Quote::where('team_id', $teamId)
            ->where('quote_number', 'like', "DEV-{$year}-%")
            ->orderByDesc('id')
            ->first();

        $sequence = 1;
        if ($last) {
            $parts = explode('-', $last->quote_number);
            $sequence = (int) end($parts) + 1;
        }

        return "DEV-{$year}-".str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
}
