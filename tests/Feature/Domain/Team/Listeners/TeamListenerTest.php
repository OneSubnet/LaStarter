<?php

namespace Tests\Feature\Domain\Team\Listeners;

use App\Core\Audit\AuditLogger;
use App\Domains\Team\Events\TeamCreatedEvent;
use App\Domains\Team\Listeners\LogTeamActionListener;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class TeamListenerTest extends TestCase
{
    use RefreshDatabase;

    public function test_team_created_listener_creates_audit_log(): void
    {
        $user = User::factory()->create();
        $team = Team::factory()->create();

        // Act as the user to set auth context
        $this->actingAs($user);

        $event = new TeamCreatedEvent($team, $user->id);
        $listener = new LogTeamActionListener(app(AuditLogger::class));
        $listener->handle($event);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'team.created',
            'subject_type' => Team::class,
            'subject_id' => $team->id,
        ]);
    }

    public function test_team_created_event_is_listened_to(): void
    {
        Event::listen(TeamCreatedEvent::class, LogTeamActionListener::class);

        $user = User::factory()->create();
        $team = Team::factory()->create();

        $event = new TeamCreatedEvent($team, $user->id);
        event($event);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'team.created',
        ]);
    }
}
