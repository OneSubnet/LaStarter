<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\AilesInvisibles\Models\Client;

class ClientFactory extends Factory
{
    protected $model = Client::class;

    public function definition(): array
    {
        return [
            'team_id' => 1,
            'type' => 'individual',
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'company_name' => null,
            'vat_number' => null,
            'vat_country' => 'FR',
            'address_line1' => fake()->streetAddress(),
            'address_line2' => null,
            'city' => fake()->city(),
            'postal_code' => fake()->postcode(),
            'country' => 'FR',
            'notes' => null,
            'status' => 'active',
        ];
    }

    public function pro(): static
    {
        return $this->state(fn () => [
            'type' => 'pro',
            'company_name' => fake()->company(),
            'vat_number' => 'FR'.fake()->numerify('###########'),
        ]);
    }
}
