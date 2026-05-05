<?php

namespace Tests\Unit\Modules\AilesInvisibles\Invoice;

use Database\Factories\ClientFactory;
use Database\Factories\InvoiceFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\AilesInvisibles\Domain\Invoice\Repository\InvoiceRepository;
use Modules\AilesInvisibles\Models\Invoice;
use Tests\Concerns\CreatesTeams;
use Tests\Concerns\WithAilesInvisibles;
use Tests\TestCase;

/**
 * Invoice Repository Tests
 */
class InvoiceRepositoryTest extends TestCase
{
    use CreatesTeams;
    use RefreshDatabase;
    use WithAilesInvisibles;

    protected InvoiceRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setupAIModule();
        $this->repository = app(InvoiceRepository::class);
    }

    public function test_find_by_client_returns_invoices(): void
    {
        [$user, $team] = $this->createTeamWithOwner();
        $client = ClientFactory::new()->forTeam($team)->create();

        InvoiceFactory::new()->forTeam($team)->forClient($client)->count(3)->create();

        $invoices = $this->repository->findByClient($client->id);

        $this->assertCount(3, $invoices);
    }

    public function test_find_by_status_filters_correctly(): void
    {
        [$user, $team] = $this->createTeamWithOwner();

        InvoiceFactory::new()->forTeam($team)->create(['status' => 'paid']);
        InvoiceFactory::new()->forTeam($team)->create(['status' => 'sent']);
        InvoiceFactory::new()->forTeam($team)->create(['status' => 'sent']);

        $sent = $this->repository->findByStatus($team->id, 'sent');

        $this->assertCount(2, $sent);
    }

    public function test_find_overdue_returns_overdue_invoices(): void
    {
        [$user, $team] = $this->createTeamWithOwner();

        InvoiceFactory::new()->forTeam($team)->create([
            'status' => 'sent',
            'due_date' => now()->subDays(5),
        ]);

        InvoiceFactory::new()->forTeam($team)->create([
            'status' => 'sent',
            'due_date' => now()->addDays(5),
        ]);

        $overdue = $this->repository->findOverdue($team->id);

        $this->assertCount(1, $overdue);
    }

    public function test_get_stats_returns_correct_counts(): void
    {
        [$user, $team] = $this->createTeamWithOwner();

        InvoiceFactory::new()->forTeam($team)->create(['status' => 'paid']);
        InvoiceFactory::new()->forTeam($team)->create(['status' => 'sent', 'due_date' => now()->addDays(5)]);
        InvoiceFactory::new()->forTeam($team)->create(['status' => 'sent', 'due_date' => now()->addDays(5)]);
        InvoiceFactory::new()->forTeam($team)->create([
            'status' => 'sent',
            'due_date' => now()->subDays(5),
        ]);

        $stats = $this->repository->getStats($team->id);

        $this->assertEquals(4, $stats['total']);
        $this->assertEquals(1, $stats['paid']);
        $this->assertEquals(3, $stats['sent']); // All sent invoices (including overdue)
        $this->assertEquals(1, $stats['overdue']);
    }
}
