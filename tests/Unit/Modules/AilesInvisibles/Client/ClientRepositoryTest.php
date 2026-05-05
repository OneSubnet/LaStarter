<?php

namespace Tests\Unit\Modules\AilesInvisibles\Client;

use Database\Factories\ClientFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\AilesInvisibles\Domain\Client\Repository\ClientRepository;
use Modules\AilesInvisibles\Models\Client;
use Tests\Concerns\CreatesTeams;
use Tests\Concerns\WithAilesInvisibles;
use Tests\TestCase;

/**
 * Client Repository Tests
 */
class ClientRepositoryTest extends TestCase
{
    use CreatesTeams;
    use RefreshDatabase;
    use WithAilesInvisibles;

    protected ClientRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setupAIModule();
        $this->repository = app(ClientRepository::class);
    }

    public function test_find_active_by_team_returns_only_active_clients(): void
    {
        $team = $this->createTeamWithOwner()[1];
        $client1 = ClientFactory::new()->forTeam($team)->create(['is_active' => true]);
        $client2 = ClientFactory::new()->forTeam($team)->create(['is_active' => false]);
        $client3 = ClientFactory::new()->forTeam($team)->create(['is_active' => true]);

        $clients = $this->repository->findActiveByTeam($team->id);

        $this->assertCount(2, $clients);
        $this->assertTrue($clients->contains('id', $client1->id));
        $this->assertFalse($clients->contains('id', $client2->id));
        $this->assertTrue($clients->contains('id', $client3->id));
    }

    public function test_find_by_email_returns_client(): void
    {
        $team = $this->createTeamWithOwner()[1];
        $client = ClientFactory::new()->forTeam($team)->create(['email' => 'test@example.com']);

        $found = $this->repository->findByEmail($team->id, 'test@example.com');

        $this->assertNotNull($found);
        $this->assertEquals($client->id, $found->id);
    }

    public function test_find_by_email_returns_null_when_not_found(): void
    {
        $team = $this->createTeamWithOwner()[1];

        $found = $this->repository->findByEmail($team->id, 'nonexistent@example.com');

        $this->assertNull($found);
    }

    public function test_search_returns_matching_clients(): void
    {
        $team = $this->createTeamWithOwner()[1];
        $client1 = ClientFactory::new()->forTeam($team)->create(['name' => 'Acme Corporation']);
        $client2 = ClientFactory::new()->forTeam($team)->create(['email' => 'test@acme.com']);
        $client3 = ClientFactory::new()->forTeam($team)->create(['company' => 'Acme Ltd']);
        $client4 = ClientFactory::new()->forTeam($team)->create(['name' => 'Other Company']);

        $results = $this->repository->search($team->id, 'Acme');

        $this->assertCount(3, $results);
        $this->assertTrue($results->contains('id', $client1->id));
        $this->assertTrue($results->contains('id', $client2->id));
        $this->assertTrue($results->contains('id', $client3->id));
        $this->assertFalse($results->contains('id', $client4->id));
    }

    public function test_find_returns_client_by_id(): void
    {
        $team = $this->createTeamWithOwner()[1];
        $client = ClientFactory::new()->forTeam($team)->create();

        $found = $this->repository->find($client->id);

        $this->assertNotNull($found);
        $this->assertEquals($client->id, $found->id);
    }

    public function test_all_returns_all_clients(): void
    {
        $team = $this->createTeamWithOwner()[1];
        ClientFactory::new()->forTeam($team)->count(3)->create();

        $clients = $this->repository->all();

        $this->assertCount(3, $clients);
    }
}
