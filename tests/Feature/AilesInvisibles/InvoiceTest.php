<?php

use App\Models\User;
use Database\Factories\ClientFactory;
use Database\Factories\InvoiceFactory;
use Modules\AilesInvisibles\Models\Invoice;
use Tests\Concerns\CreatesTeams;
use Tests\Concerns\WithAilesInvisibles;

uses(CreatesTeams::class, WithAilesInvisibles::class);

beforeEach(function () {
    $this->setupAIModule();

    [$this->owner, $this->team] = $this->createTeamWithOwner('Test Team');
    $this->teamSlug = (string) $this->team->id;
    $this->client = ClientFactory::new()->create(['team_id' => $this->team->id]);
});

describe('InvoicePolicy', function () {
    test('owner can view any invoices', function () {
        setupTeamAuth($this->owner, $this->team);
        expect($this->owner->can('viewAny', Invoice::class))->toBeTrue();
    });

    test('owner can create invoices', function () {
        setupTeamAuth($this->owner, $this->team);
        expect($this->owner->can('create', Invoice::class))->toBeTrue();
    });

    test('owner can send invoices', function () {
        $invoice = InvoiceFactory::new()->create([
            'team_id' => $this->team->id,
            'client_id' => $this->client->id,
        ]);
        setupTeamAuth($this->owner, $this->team);
        expect($this->owner->can('send', $invoice))->toBeTrue();
    });

    test('owner can cancel invoices', function () {
        $invoice = InvoiceFactory::new()->create([
            'team_id' => $this->team->id,
            'client_id' => $this->client->id,
        ]);
        setupTeamAuth($this->owner, $this->team);
        expect($this->owner->can('cancel', $invoice))->toBeTrue();
    });

    test('member without permission cannot create invoices', function () {
        $member = User::factory()->create();
        $this->addMemberToTeam($this->team, $member);
        setupTeamAuth($member, $this->team);

        expect($member->can('create', Invoice::class))->toBeFalse();
    });

    test('member with permission can create invoices', function () {
        $member = User::factory()->create();
        $this->addMemberToTeam($this->team, $member);
        $this->givePermission($member, 'ai.invoice.create', $this->team);
        setupTeamAuth($member, $this->team);

        expect($member->can('create', Invoice::class))->toBeTrue();
    });

    test('member with record-payment permission can record payments', function () {
        $invoice = InvoiceFactory::new()->create([
            'team_id' => $this->team->id,
            'client_id' => $this->client->id,
        ]);
        $member = User::factory()->create();
        $this->addMemberToTeam($this->team, $member);
        $this->givePermission($member, 'ai.invoice.record-payment', $this->team);
        setupTeamAuth($member, $this->team);

        expect($member->can('recordPayment', $invoice))->toBeTrue();
    });
});

describe('Invoice CRUD', function () {
    test('invoice is created with team scope', function () {
        $invoice = InvoiceFactory::new()->create([
            'team_id' => $this->team->id,
            'client_id' => $this->client->id,
        ]);

        expect($invoice->team_id)->toBe($this->team->id);
        expect($invoice->client_id)->toBe($this->client->id);
        expect($invoice->status)->toBe('draft');
        $this->assertDatabaseHas('ai_invoices', ['id' => $invoice->id]);
    });

    test('invoice status can be updated to sent', function () {
        $invoice = InvoiceFactory::new()->create([
            'team_id' => $this->team->id,
            'client_id' => $this->client->id,
            'status' => 'draft',
        ]);

        $invoice->update(['status' => 'sent']);

        expect($invoice->fresh()->status)->toBe('sent');
    });

    test('invoice status can be cancelled', function () {
        $invoice = InvoiceFactory::new()->create([
            'team_id' => $this->team->id,
            'client_id' => $this->client->id,
            'status' => 'sent',
        ]);

        $invoice->update(['status' => 'cancelled']);

        expect($invoice->fresh()->status)->toBe('cancelled');
    });

    test('invoice can be soft deleted', function () {
        $invoice = InvoiceFactory::new()->create([
            'team_id' => $this->team->id,
            'client_id' => $this->client->id,
        ]);
        $invoice->delete();

        $this->assertSoftDeleted('ai_invoices', ['id' => $invoice->id]);
        expect(Invoice::find($invoice->id))->toBeNull();
        expect(Invoice::withTrashed()->find($invoice->id))->not->toBeNull();
    });

    test('invoice data is scoped to team', function () {
        $otherTeamOwner = User::factory()->create();
        $otherTeam = $this->createTeamForUser($otherTeamOwner, 'Other Team');
        $otherClient = ClientFactory::new()->create(['team_id' => $otherTeam->id]);

        InvoiceFactory::new()->count(2)->create([
            'team_id' => $this->team->id,
            'client_id' => $this->client->id,
        ]);
        InvoiceFactory::new()->count(3)->create([
            'team_id' => $otherTeam->id,
            'client_id' => $otherClient->id,
        ]);

        setupTeamAuth($this->owner, $this->team);
        expect(Invoice::count())->toBe(2);
    });

    test('invoice belongs to client', function () {
        $invoice = InvoiceFactory::new()->create([
            'team_id' => $this->team->id,
            'client_id' => $this->client->id,
        ]);

        expect($invoice->client)->not->toBeNull();
        expect($invoice->client->id)->toBe($this->client->id);
    });

    test('invoice has financial amounts', function () {
        $invoice = InvoiceFactory::new()->create([
            'team_id' => $this->team->id,
            'client_id' => $this->client->id,
            'subtotal' => 100.00,
            'tax_amount' => 20.00,
            'total' => 120.00,
            'paid_amount' => 0,
        ]);

        expect((float) $invoice->subtotal)->toBe(100.00);
        expect((float) $invoice->tax_amount)->toBe(20.00);
        expect((float) $invoice->total)->toBe(120.00);
        expect((float) $invoice->paid_amount)->toBe(0.00);
    });
});
