<?php

namespace Database\Factories;

use App\Models\Team;
use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\AilesInvisibles\Models\Client;

class ClientFactory extends Factory
{
    protected $model = Client::class;

    public function definition(): array
    {
        return [
            'team_id' => 1,
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'company' => fake()->company(),
            'address' => fake()->streetAddress(),
            'city' => fake()->city(),
            'postal_code' => fake()->postcode(),
            'country' => fake()->countryCode(),
            'notes' => fake()->sentence(),
            'is_active' => true,
        ];
    }

    /**
     * Indicate the client belongs to a specific team.
     */
    public function forTeam(Team|int $team): static
    {
        $teamId = is_int($team) ? $team : $team->id;

        return $this->state(fn (array $attributes) => [
            'team_id' => $teamId,
        ]);
    }
}
