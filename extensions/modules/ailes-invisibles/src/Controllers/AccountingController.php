<?php

namespace Modules\AilesInvisibles\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Modules\AilesInvisibles\Models\Invoice;
use Modules\AilesInvisibles\Models\JournalEntry;
use Modules\AilesInvisibles\Services\AccountingService;

class AccountingController
{
    public function __construct(
        protected AccountingService $accountingService,
    ) {}

    public function dashboard(Request $request): Response
    {
        Gate::authorize('viewAny', Invoice::class);

        $teamId = $request->user()->currentTeam->id;

        return Inertia::render('ailes-invisibles/admin/accounting/Dashboard', [
            'kpis' => $this->accountingService->getDashboardKpis($teamId),
            'monthly_revenue' => $this->accountingService->getMonthlyRevenue($teamId),
        ]);
    }

    public function reports(Request $request): Response
    {
        Gate::authorize('viewAny', Invoice::class);

        $teamId = $request->user()->currentTeam->id;

        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $query = JournalEntry::where('team_id', $teamId)
            ->with(['lines', 'lines.account']);

        if (! empty($validated['from'])) {
            $query->where('date', '>=', $validated['from']);
        }

        if (! empty($validated['to'])) {
            $query->where('date', '<=', $validated['to']);
        }

        $entries = $query->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (JournalEntry $entry) => [
                'id' => $entry->id,
                'date' => $entry->date->toDateString(),
                'description' => $entry->description,
                'reference_type' => $entry->reference_type,
                'reference_id' => $entry->reference_id,
                'lines' => $entry->lines->map(fn ($line) => [
                    'id' => $line->id,
                    'account' => $line->account ? [
                        'id' => $line->account->id,
                        'name' => $line->account->name,
                        'code' => $line->account->code,
                        'type' => $line->account->type,
                    ] : null,
                    'debit' => (float) $line->debit,
                    'credit' => (float) $line->credit,
                    'description' => $line->description,
                ]),
                'created_at' => $entry->created_at->toISOString(),
            ]);

        return Inertia::render('ailes-invisibles/admin/accounting/Reports', [
            'entries' => $entries,
            'filters' => [
                'from' => $validated['from'] ?? null,
                'to' => $validated['to'] ?? null,
            ],
        ]);
    }
}
