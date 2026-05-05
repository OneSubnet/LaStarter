<?php

namespace Tests\Unit\Modules\AilesInvisibles\Client;

use Database\Factories\ClientFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\AilesInvisibles\Domain\Client\Services\ClientService;
use Modules\AilesInvisibles\Models\Client;
use Tests\Concerns\CreatesTeams;
use Tests\Concerns\WithAilesInvisibles;
use Tests\TestCase;

/**
 * Client Service Tests
 */
class ClientServiceTest extends TestCase
{
    use CreatesTeams;
    use RefreshDatabase;
    use WithAilesInvisibles;

    protected ClientService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setupAIModule();
        $this->service = app(ClientService::class);
    }

    public function test_create_creates_new_client(): void
    {
        [$user, $team] = $this->createTeamWithOwner();

        $client = $this->service->create(
            teamId: $team->id,
            userId: $user->id,
            name: 'Test Client',
            email: 'test@example.com',
            company: 'Test Company'
        );

        $this->assertDatabaseHas('clients', [
            'name' => 'Test Client',
            'email' => 'test@example.com',
            'company' => 'Test Company',
            'team_id' => $team->id,
        ]);
    }

    public function test_get_by_id_returns_client(): void
    {
        [$user, $team] = $this->createTeamWithOwner();
        $client = ClientFactory::new()->forTeam($team)->create();

        $found = $this->service->getById($client->id);

        $this->assertNotNull($found);
        $this->assertEquals($client->id, $found->id);
    }

    public function test_get_by_id_returns_null_when_not_found(): void
    {
        $found = $this->service->getById(999);

        $this->assertNull($found);
    }

    public function test_get_for_team_returns_clients(): void
    {
        [$user, $team] = $this->createTeamWithOwner();
        ClientFactory::new()->forTeam($team)->count(3)->create();

        $clients = $this->service->getForTeam($team->id);

        $this->assertCount(3, $clients);
    }

    public function test_get_for_team_active_only_returns_active_clients(): void
    {
        [$user, $team] = $this->createTeamWithOwner();
        ClientFactory::new()->forTeam($team)->create(['is_active' => true]);
        ClientFactory::new()->forTeam($team)->create(['is_active' => false]);

        $clients = $this->service->getForTeam($team->id, activeOnly: true);

        $this->assertCount(1, $clients);
    }

    public function test_search_returns_matching_clients(): void
    {
        [$user, $team] = $this->createTeamWithOwner();
        ClientFactory::new()->forTeam($team)->create(['name' => 'Acme Corporation']);
        ClientFactory::new()->forTeam($team)->create(['name' => 'Other Company']);

        $results = $this->service->search($team->id, 'Acme');

        $this->assertCount(1, $results);
    }

    public function test_update_updates_client(): void
    {
        [$user, $team] = $this->createTeamWithOwner();
        $client = ClientFactory::new()->forTeam($team)->create(['name' => 'Old Name']);

        $updated = $this->service->update(
            client: $client,
            userId: $user->id,
            name: 'New Name'
        );

        $this->assertEquals('New Name', $updated->name);
        $this->assertDatabaseHas('clients', ['id' => $client->id, 'name' => 'New Name']);
    }

    public function test_delete_deletes_client(): void
    {
        [$user, $team] = $this->createTeamWithOwner();
        $client = ClientFactory::new()->forTeam($team)->create();

        $result = $this->service->delete($client, $user->id);

        $this->assertTrue($result);
        $this->assertSoftDeleted('clients', ['id' => $client->id]);
    }
}
