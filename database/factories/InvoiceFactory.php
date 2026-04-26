<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\AilesInvisibles\Models\Invoice;

class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    public function definition(): array
    {
        return [
            'team_id' => 1,
            'client_id' => null,
            'invoice_number' => 'INV-'.fake()->unique()->numerify('####'),
            'status' => 'draft',
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'subtotal' => fake()->randomFloat(2, 100, 10000),
            'tax_amount' => fake()->randomFloat(2, 10, 2000),
            'total' => fake()->randomFloat(2, 110, 12000),
            'paid_amount' => 0,
            'notes' => null,
        ];
    }
}
