<?php

namespace Modules\AilesInvisibles\Services;

use Illuminate\Support\Facades\DB;

class DatabaseQueryService
{
    public function yearExpression(string $column): string
    {
        return $this->dateExpression($column, '%Y', 'YEAR');
    }

    public function monthExpression(string $column): string
    {
        return $this->dateExpression($column, '%m', 'MONTH');
    }

    public function dayExpression(string $column): string
    {
        return $this->dateExpression($column, '%d', 'DAY');
    }

    public function groupByYearMonth(string $column): string
    {
        return "{$this->yearExpression($column)}, {$this->monthExpression($column)}";
    }

    public function orderByYearMonth(string $column): string
    {
        return $this->groupByYearMonth($column);
    }

    public function selectYearMonth(string $column, string $yearAlias = 'year', string $monthAlias = 'month'): string
    {
        $year = $this->yearExpression($column);
        $month = $this->monthExpression($column);

        return "{$year} as {$yearAlias}, {$month} as {$monthAlias}";
    }

    protected function dateExpression(string $column, string $sqliteFormat, string $sqlFunction): string
    {
        if ($this->isSqlite()) {
            return "strftime('{$sqliteFormat}', {$column})";
        }

        return "EXTRACT({$sqlFunction} FROM {$column})";
    }

    protected function isSqlite(): bool
    {
        return DB::getDriverName() === 'sqlite';
    }
}
