<?php

use App\Models\User;
use Database\Factories\ClientFactory;
use Modules\AilesInvisibles\Models\Client;
use Tests\Concerns\CreatesTeams;
use Tests\Concerns\WithAilesInvisibles;

uses(CreatesTeams::class, WithAilesInvisibles::class);

beforeEach(function () {
    $this->setupAIModule();

    [$this->owner, $this->team] = $this->createTeamWithOwner('Test Team');
    $this->teamSlug = (string) $this->team->id;
});

describe('ClientPolicy', function () {
    test('owner can view any clients', function () {
        setupTeamAuth($this->owner, $this->team);
        expect($this->owner->can('viewAny', Client::class))->toBeTrue();
    });

    test('owner can create clients', function () {
        setupTeamAuth($this->owner, $this->team);
        expect($this->owner->can('create', Client::class))->toBeTrue();
    });

    test('owner can update clients', function () {
        setupTeamAuth($this->owner, $this->team);
        $client = ClientFactory::new()->create(['team_id' => $this->team->id]);
        expect($this->owner->can('update', $client))->toBeTrue();
    });

    test('owner can delete clients', function () {
        setupTeamAuth($this->owner, $this->team);
        $client = ClientFactory::new()->create(['team_id' => $this->team->id]);
        expect($this->owner->can('delete', $client))->toBeTrue();
    });

    test('member without permission cannot create clients', function () {
        $member = User::factory()->create();
        $this->addMemberToTeam($this->team, $member);
        setupTeamAuth($member, $this->team);

        expect($member->can('create', Client::class))->toBeFalse();
    });

    test('member with permission can create clients', function () {
        $member = User::factory()->create();
        $this->addMemberToTeam($this->team, $member);
        $this->givePermission($member, 'ai.client.create', $this->team);
        setupTeamAuth($member, $this->team);

        expect($member->can('create', Client::class))->toBeTrue();
    });
});

describe('Client CRUD', function () {
    test('client is created with team scope', function () {
        $client = ClientFactory::new()->create(['team_id' => $this->team->id]);

        expect($client->team_id)->toBe($this->team->id);
        expect($client->type->value)->toBe('individual');
        expect($client->status->value)->toBe('active');
        $this->assertDatabaseHas('ai_clients', ['id' => $client->id]);
    });

    test('client can be updated', function () {
        $client = ClientFactory::new()->create(['team_id' => $this->team->id]);
        $client->update(['first_name' => 'Updated']);

        expect($client->fresh()->first_name)->toBe('Updated');
    });

    test('client can be soft deleted', function () {
        $client = ClientFactory::new()->create(['team_id' => $this->team->id]);
        $client->delete();

        $this->assertSoftDeleted('ai_clients', ['id' => $client->id]);
        expect(Client::find($client->id))->toBeNull();
        expect(Client::withTrashed()->find($client->id))->not->toBeNull();
    });

    test('pro client has company fields', function () {
        $client = ClientFactory::new()->pro()->create(['team_id' => $this->team->id]);

        expect($client->type->value)->toBe('pro');
        expect($client->company_name)->not->toBeNull();
        expect($client->vat_number)->not->toBeNull();
    });

    test('client data is scoped to team', function () {
        $otherTeamOwner = User::factory()->create();
        $otherTeam = $this->createTeamForUser($otherTeamOwner, 'Other Team');

        ClientFactory::new()->count(3)->create(['team_id' => $this->team->id]);
        ClientFactory::new()->count(2)->create(['team_id' => $otherTeam->id]);

        setupTeamAuth($this->owner, $this->team);
        expect(Client::count())->toBe(3);
    });

    test('client generates full name', function () {
        $client = ClientFactory::new()->create([
            'team_id' => $this->team->id,
            'first_name' => 'Jean',
            'last_name' => 'Dupont',
        ]);

        expect($client->fullName())->toBe('Jean Dupont');
    });
});
