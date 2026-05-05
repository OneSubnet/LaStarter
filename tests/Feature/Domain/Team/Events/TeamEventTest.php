<?php

namespace Tests\Feature\Domain\Team\Events;

use App\Domains\Team\Events\TeamCreatedEvent;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class TeamEventTest extends TestCase
{
    use RefreshDatabase;

    public function test_team_created_event_is_dispatched(): void
    {
        Event::fake(TeamCreatedEvent::class);

        $user = User::factory()->create();
        $team = Team::factory()->create([
            'name' => 'Test Team',
        ]);

        event(new TeamCreatedEvent($team, $user->id));

        Event::assertDispatched(TeamCreatedEvent::class);
    }

    public function test_team_created_event_has_correct_properties(): void
    {
        $user = User::factory()->create();
        $team = Team::factory()->create();

        $event = new TeamCreatedEvent($team, $user->id);

        $this->assertSame($team, $event->getTeam());
        $this->assertEquals($team->id, $event->teamId);
        $this->assertEquals($user->id, $event->ownerId);
        $this->assertEquals('created', $event->getAction());
    }

    public function test_team_event_get_action_returns_correct_string(): void
    {
        $team = Team::factory()->create();

        $event = new TeamCreatedEvent($team, 1);

        $this->assertEquals('created', $event->getAction());
    }
}
