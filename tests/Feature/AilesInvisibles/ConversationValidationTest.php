<?php

use App\Http\Middleware\EnsureTeamMembership;
use App\Models\User;
use Modules\AilesInvisibles\Models\Client;
use Modules\AilesInvisibles\Models\ClientUser;
use Spatie\Permission\Models\Permission;
use Tests\Concerns\CreatesTeams;
use Tests\Concerns\WithAilesInvisibles;

uses(CreatesTeams::class, WithAilesInvisibles::class);

beforeEach(function () {
    $this->setupAIModule();

    // Seed the actual permissions used by ConversationPolicy
    $messagingPerms = ['ai.messaging.view', 'ai.messaging.send'];
    foreach ($messagingPerms as $name) {
        Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
    }

    // Load module routes using the same pattern as AilesInvisiblesServiceProvider
    $routesPath = base_path('extensions/modules/ailes-invisibles/routes/web.php');
    $this->app['router']->middleware(['web', 'auth', 'verified', EnsureTeamMembership::class])
        ->prefix('{current_team}')
        ->group($routesPath);

    [$this->owner, $this->team] = $this->createTeamWithOwner('Test Team');

    // Give owner the messaging permissions
    $this->givePermission($this->owner, 'ai.messaging.view', $this->team);

    setupTeamAuth($this->owner, $this->team);
});

describe('ConversationController participant type validation', function () {
    test('valid participant type User is accepted', function () {
        $otherUser = User::factory()->create();
        $this->addMemberToTeam($this->team, $otherUser);

        $response = $this->post(route('ai.conversations.store', ['current_team' => $this->team->slug]), [
            'type' => 'direct',
            'participants' => [
                ['participant_type' => User::class, 'participant_id' => $otherUser->id],
            ],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('ai_conversation_participants', [
            'participant_type' => User::class,
            'participant_id' => $otherUser->id,
        ]);
    });

    test('valid participant type ClientUser is accepted', function () {
        $client = Client::create([
            'team_id' => $this->team->id,
            'first_name' => 'Test',
            'last_name' => 'Client',
            'email' => 'client@example.com',
        ]);

        $clientUser = ClientUser::create([
            'team_id' => $this->team->id,
            'client_id' => $client->id,
            'email' => 'client@example.com',
            'name' => 'Client User',
            'password' => bcrypt('password'),
        ]);

        $response = $this->post(route('ai.conversations.store', ['current_team' => $this->team->slug]), [
            'type' => 'direct',
            'participants' => [
                ['participant_type' => ClientUser::class, 'participant_id' => $clientUser->id],
            ],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('ai_conversation_participants', [
            'participant_type' => ClientUser::class,
            'participant_id' => $clientUser->id,
        ]);
    });

    test('invalid participant type is rejected with validation error', function () {
        $response = $this->post(route('ai.conversations.store', ['current_team' => $this->team->slug]), [
            'type' => 'direct',
            'participants' => [
                ['participant_type' => 'App\\Models\\Admin', 'participant_id' => 1],
            ],
        ]);

        $response->assertSessionHasErrors(['participants.0.participant_type']);
    });

    test('arbitrary class injection attempt is rejected', function () {
        $response = $this->post(route('ai.conversations.store', ['current_team' => $this->team->slug]), [
            'type' => 'direct',
            'participants' => [
                ['participant_type' => 'Illuminate\\Support\\Facades\\Gate', 'participant_id' => 1],
            ],
        ]);

        $response->assertSessionHasErrors(['participants.0.participant_type']);
    });

    test('empty participant type is rejected', function () {
        $response = $this->post(route('ai.conversations.store', ['current_team' => $this->team->slug]), [
            'type' => 'direct',
            'participants' => [
                ['participant_type' => '', 'participant_id' => 1],
            ],
        ]);

        $response->assertSessionHasErrors(['participants.0.participant_type']);
    });
});
