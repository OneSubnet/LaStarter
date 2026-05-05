<?php

namespace Database\Factories;

use App\Models\Team;
use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\AilesInvisibles\Models\Client;
use Modules\AilesInvisibles\Models\Invoice;

class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    public function definition(): array
    {
        $subtotal = fake()->randomFloat(2, 100, 10000);
        $taxRate = fake()->randomFloat(2, 0, 25);
        $taxAmount = $subtotal * ($taxRate / 100);
        $total = $subtotal + $taxAmount;

        return [
            'team_id' => 1,
            'client_id' => fn () => ClientFactory::new()->create()->id,
            'number' => 'INV-'.fake()->unique()->numerify('####'),
            'date' => fake()->dateTimeBetween('-1 year', 'now'),
            'due_date' => fake()->dateTimeBetween('now', '+1 year'),
            'subtotal' => $subtotal,
            'tax_rate' => $taxRate,
            'tax_amount' => $taxAmount,
            'total' => $total,
            'status' => fake()->randomElement(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
            'notes' => fake()->sentence(),
        ];
    }

    /**
     * Indicate the invoice belongs to a specific team.
     */
    public function forTeam(Team|int $team): static
    {
        $teamId = is_int($team) ? $team : $team->id;

        return $this->state(fn (array $attributes) => [
            'team_id' => $teamId,
        ]);
    }

    /**
     * Indicate the invoice belongs to a specific client.
     */
    public function forClient(Client|int $client): static
    {
        $clientId = is_int($client) ? $client : $client->id;

        return $this->state(fn (array $attributes) => [
            'client_id' => $clientId,
        ]);
    }
}
