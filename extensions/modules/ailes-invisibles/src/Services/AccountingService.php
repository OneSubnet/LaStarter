<?php

namespace Modules\AilesInvisibles\Services;

use Modules\AilesInvisibles\Models\Account;
use Modules\AilesInvisibles\Models\Invoice;
use Modules\AilesInvisibles\Models\JournalEntry;
use Modules\AilesInvisibles\Models\JournalEntryLine;
use Modules\AilesInvisibles\Models\Payment;

class AccountingService
{
    public function __construct(
        protected DatabaseQueryService $dbQuery,
    ) {}

    public function getDashboardKpis(int $teamId): array
    {
        $totalRevenue = (float) Invoice::where('team_id', $teamId)
            ->whereIn('status', ['paid', 'partial'])
            ->sum('paid_amount');

        $unpaid = (float) (Invoice::where('team_id', $teamId)
            ->whereIn('status', ['sent', 'partial', 'overdue'])
            ->selectRaw('SUM(total - paid_amount) as remaining')
            ->value('remaining') ?? 0);

        $taxCollected = (float) Invoice::where('team_id', $teamId)
            ->whereIn('status', ['paid', 'partial', 'sent'])
            ->sum('tax_amount');

        return [
            'total_revenue' => $totalRevenue,
            'unpaid' => $unpaid,
            'tax_collected' => $taxCollected,
        ];
    }

    public function getMonthlyRevenue(int $teamId): array
    {
        $dateColumn = 'issue_date';

        return Invoice::where('team_id', $teamId)
            ->where($dateColumn, '>=', now()->subMonths(12))
            ->selectRaw("
                {$this->dbQuery->selectYearMonth($dateColumn)},
                SUM(total) as revenue,
                SUM(paid_amount) as collected,
                SUM(tax_amount) as tax
            ")
            ->groupByRaw($this->dbQuery->groupByYearMonth($dateColumn))
            ->orderByRaw($this->dbQuery->orderByYearMonth($dateColumn))
            ->get()
            ->map(fn ($row) => [
                'year' => (int) $row->year,
                'month' => (int) $row->month,
                'revenue' => (float) $row->revenue,
                'collected' => (float) $row->collected,
                'tax' => (float) $row->tax,
            ])
            ->all();
    }

    // Auto-generate journal entry from an invoice
    public function recordInvoice(Invoice $invoice): JournalEntry
    {
        // Ensure default accounts exist
        $revenue = $this->ensureAccount($invoice->team_id, 'Ventes', 'revenue', '706');
        $receivable = $this->ensureAccount($invoice->team_id, 'Clients', 'asset', '411');
        $vat = $this->ensureAccount($invoice->team_id, 'TVA collectee', 'liability', '44571');

        $entry = JournalEntry::create([
            'team_id' => $invoice->team_id,
            'date' => $invoice->issue_date,
            'description' => "Facture {$invoice->invoice_number}",
            'reference_type' => Invoice::class,
            'reference_id' => $invoice->id,
        ]);

        // Debit: Clients (receivable) = total
        JournalEntryLine::create([
            'journal_entry_id' => $entry->id,
            'account_id' => $receivable->id,
            'debit' => $invoice->total,
            'credit' => 0,
        ]);

        // Credit: Ventes (revenue) = subtotal
        JournalEntryLine::create([
            'journal_entry_id' => $entry->id,
            'account_id' => $revenue->id,
            'debit' => 0,
            'credit' => $invoice->subtotal,
        ]);

        // Credit: TVA collectee = tax_amount
        if ($invoice->tax_amount > 0) {
            JournalEntryLine::create([
                'journal_entry_id' => $entry->id,
                'account_id' => $vat->id,
                'debit' => 0,
                'credit' => $invoice->tax_amount,
            ]);
        }

        return $entry;
    }

    // Auto-generate journal entry from a payment
    public function recordPayment(Payment $payment): JournalEntry
    {
        $bank = $this->ensureAccount($payment->team_id, 'Banque', 'asset', '512');
        $receivable = $this->ensureAccount($payment->team_id, 'Clients', 'asset', '411');

        $entry = JournalEntry::create([
            'team_id' => $payment->team_id,
            'date' => $payment->paid_at->toDateString(),
            'description' => "Paiement facture {$payment->invoice->invoice_number}",
            'reference_type' => Payment::class,
            'reference_id' => $payment->id,
        ]);

        // Debit: Banque = amount
        JournalEntryLine::create([
            'journal_entry_id' => $entry->id,
            'account_id' => $bank->id,
            'debit' => $payment->amount,
            'credit' => 0,
        ]);

        // Credit: Clients = amount
        JournalEntryLine::create([
            'journal_entry_id' => $entry->id,
            'account_id' => $receivable->id,
            'debit' => 0,
            'credit' => $payment->amount,
        ]);

        return $entry;
    }

    protected function ensureAccount(int $teamId, string $name, string $type, string $code): Account
    {
        return Account::firstOrCreate(
            ['team_id' => $teamId, 'code' => $code],
            ['name' => $name, 'type' => $type, 'is_default' => true]
        );
    }
}
