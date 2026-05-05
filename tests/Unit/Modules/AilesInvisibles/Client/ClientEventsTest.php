<?php

namespace Tests\Unit\Modules\AilesInvisibles\Client;

use Database\Factories\ClientFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Modules\AilesInvisibles\Domain\Client\Events\ClientCreatedEvent;
use Modules\AilesInvisibles\Domain\Client\Events\ClientDeletedEvent;
use Modules\AilesInvisibles\Domain\Client\Events\ClientUpdatedEvent;
use Modules\AilesInvisibles\Models\Client;
use Tests\Concerns\CreatesTeams;
use Tests\Concerns\WithAilesInvisibles;
use Tests\TestCase;

/**
 * Client Events Tests
 */
class ClientEventsTest extends TestCase
{
    use CreatesTeams;
    use RefreshDatabase;
    use WithAilesInvisibles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setupAIModule();
    }

    public function test_client_created_event_dispatches(): void
    {
        Event::fake();

        [$user, $team] = $this->createTeamWithOwner();
        $client = ClientFactory::new()->forTeam($team)->make(['id' => 1]);

        event(new ClientCreatedEvent($client, $user->id, $team->id));

        Event::assertDispatched(ClientCreatedEvent::class, function ($event) use ($client, $team) {
            return $event->model->id === $client->id
                && $event->teamId === $team->id
                && $event->getAction() === 'created';
        });
    }

    public function test_client_updated_event_dispatches(): void
    {
        Event::fake();

        [$user, $team] = $this->createTeamWithOwner();
        $client = ClientFactory::new()->forTeam($team)->create();

        event(new ClientUpdatedEvent($client, $user->id, $team->id));

        Event::assertDispatched(ClientUpdatedEvent::class, function ($event) use ($client, $team) {
            return $event->model->id === $client->id
                && $event->teamId === $team->id
                && $event->getAction() === 'updated';
        });
    }

    public function test_client_deleted_event_dispatches(): void
    {
        Event::fake();

        [$user, $team] = $this->createTeamWithOwner();
        $client = ClientFactory::new()->forTeam($team)->make(['id' => 1, 'name' => 'Test Client']);

        event(new ClientDeletedEvent($client->id, $client->name, $user->id, $team->id));

        Event::assertDispatched(ClientDeletedEvent::class, function ($event) use ($team) {
            return $event->clientId === 1
                && $event->clientName === 'Test Client'
                && $event->teamId === $team->id
                && $event->getAction() === 'deleted';
        });
    }

    public function test_client_deleted_event_resource_description(): void
    {
        [$user, $team] = $this->createTeamWithOwner();
        $client = ClientFactory::new()->forTeam($team)->make(['id' => 1, 'name' => 'Test Client']);

        $event = new ClientDeletedEvent($client->id, $client->name, $user->id, $team->id);

        $description = $event->getDescription();

        $this->assertStringContainsString('Client #1', $description);
        $this->assertStringContainsString('Test Client', $description);
    }
}
