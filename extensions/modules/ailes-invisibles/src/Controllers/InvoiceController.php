<?php

namespace Modules\AilesInvisibles\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Modules\AilesInvisibles\Enums\InvoiceStatus;
use Modules\AilesInvisibles\Http\Requests\RecordPaymentRequest;
use Modules\AilesInvisibles\Http\Requests\StoreInvoiceRequest;
use Modules\AilesInvisibles\Models\Client;
use Modules\AilesInvisibles\Models\Invoice;
use Modules\AilesInvisibles\Services\InvoiceService;

class InvoiceController
{
    public function __construct(
        protected InvoiceService $invoiceService,
    ) {}

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Invoice::class);

        $invoices = Invoice::query()
            ->with('client')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (Invoice $invoice) => [
                'id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'status' => $invoice->status instanceof \BackedEnum ? $invoice->status->value : $invoice->status,
                'issue_date' => $invoice->issue_date?->toDateString(),
                'due_date' => $invoice->due_date?->toDateString(),
                'subtotal' => (float) $invoice->subtotal,
                'tax_amount' => (float) $invoice->tax_amount,
                'total' => (float) $invoice->total,
                'paid_amount' => (float) $invoice->paid_amount,
                'client' => $invoice->client ? [
                    'id' => $invoice->client->id,
                    'first_name' => $invoice->client->first_name,
                    'last_name' => $invoice->client->last_name,
                    'company_name' => $invoice->client->company_name,
                ] : null,
                'created_at' => $invoice->created_at->toISOString(),
            ]);

        $clients = Client::query()
            ->orderBy('last_name')
            ->get()
            ->map(fn (Client $client) => [
                'id' => $client->id,
                'first_name' => $client->first_name,
                'last_name' => $client->last_name,
                'company_name' => $client->company_name,
            ]);

        return Inertia::render('ailes-invisibles/admin/invoices/Index', [
            'invoices' => $invoices,
            'clients' => $clients,
        ]);
    }

    public function show(Request $request): Response
    {
        $invoice = Invoice::with(['client', 'lines', 'lines.product', 'payments', 'quote', 'event'])
            ->findOrFail($request->route('invoice'));

        Gate::authorize('view', $invoice);

        return Inertia::render('ailes-invisibles/admin/invoices/Show', [
            'invoice' => [
                'id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'status' => $invoice->status instanceof \BackedEnum ? $invoice->status->value : $invoice->status,
                'issue_date' => $invoice->issue_date?->toDateString(),
                'due_date' => $invoice->due_date?->toDateString(),
                'subtotal' => (float) $invoice->subtotal,
                'tax_amount' => (float) $invoice->tax_amount,
                'total' => (float) $invoice->total,
                'paid_amount' => (float) $invoice->paid_amount,
                'notes' => $invoice->notes,
                'client' => $invoice->client ? [
                    'id' => $invoice->client->id,
                    'first_name' => $invoice->client->first_name,
                    'last_name' => $invoice->client->last_name,
                    'company_name' => $invoice->client->company_name,
                    'email' => $invoice->client->email,
                    'address_line1' => $invoice->client->address_line1,
                    'address_line2' => $invoice->client->address_line2,
                    'city' => $invoice->client->city,
                    'postal_code' => $invoice->client->postal_code,
                    'country' => $invoice->client->country,
                ] : null,
                'quote' => $invoice->quote ? [
                    'id' => $invoice->quote->id,
                    'quote_number' => $invoice->quote->quote_number,
                ] : null,
                'event' => $invoice->event ? [
                    'id' => $invoice->event->id,
                    'title' => $invoice->event->title,
                ] : null,
                'lines' => $invoice->lines->map(fn ($line) => [
                    'id' => $line->id,
                    'product_id' => $line->product_id,
                    'product' => $line->product ? [
                        'id' => $line->product->id,
                        'name' => $line->product->name,
                    ] : null,
                    'description' => $line->description,
                    'quantity' => (float) $line->quantity,
                    'unit_price' => (float) $line->unit_price,
                    'tax_rate' => (float) $line->tax_rate,
                    'line_total' => (float) $line->line_total,
                    'sort_order' => $line->sort_order,
                ]),
                'payments' => $invoice->payments->map(fn ($payment) => [
                    'id' => $payment->id,
                    'amount' => (float) $payment->amount,
                    'method' => $payment->method,
                    'reference' => $payment->reference,
                    'paid_at' => $payment->paid_at?->toISOString(),
                    'notes' => $payment->notes,
                ]),
                'created_at' => $invoice->created_at->toISOString(),
                'updated_at' => $invoice->updated_at->toISOString(),
            ],
        ]);
    }

    public function store(StoreInvoiceRequest $request): RedirectResponse
    {
        Gate::authorize('create', Invoice::class);

        $validated = $request->validated();
        $file = $request->file('file');

        $invoice = $this->invoiceService->createInvoice(
            $request->user()->currentTeam->id,
            $validated,
            $file,
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Invoice created.')]);

        return to_route('ai.invoices.show', [
            'current_team' => $request->user()->currentTeam->slug,
            'invoice' => $invoice->id,
        ]);
    }

    public function update(StoreInvoiceRequest $request): RedirectResponse
    {
        $invoice = Invoice::findOrFail($request->route('invoice'));

        Gate::authorize('update', $invoice);

        $validated = $request->validated();
        $file = $request->file('file');

        $this->invoiceService->updateInvoice($invoice, $validated, $file);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Invoice updated.')]);

        return to_route('ai.invoices.show', [
            'current_team' => $request->user()->currentTeam->slug,
            'invoice' => $invoice->id,
        ]);
    }

    public function destroy(Request $request): RedirectResponse
    {
        $invoice = Invoice::findOrFail($request->route('invoice'));

        Gate::authorize('delete', $invoice);

        $invoice->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Invoice deleted.')]);

        return to_route('ai.invoices.index', [
            'current_team' => $request->user()->currentTeam->slug,
        ]);
    }

    public function send(Request $request): RedirectResponse
    {
        $invoice = Invoice::findOrFail($request->route('invoice'));

        Gate::authorize('send', $invoice);

        $invoice->update(['status' => InvoiceStatus::Sent->value]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Invoice sent.')]);

        return to_route('ai.invoices.show', [
            'current_team' => $request->user()->currentTeam->slug,
            'invoice' => $invoice->id,
        ]);
    }

    public function recordPayment(RecordPaymentRequest $request): RedirectResponse
    {
        $invoice = Invoice::findOrFail($request->route('invoice'));

        Gate::authorize('recordPayment', $invoice);

        DB::transaction(fn () => $this->invoiceService->recordPayment($invoice, $request->validated()));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment recorded.')]);

        return to_route('ai.invoices.show', [
            'current_team' => $request->user()->currentTeam->slug,
            'invoice' => $invoice->id,
        ]);
    }

    public function cancel(Request $request): RedirectResponse
    {
        $invoice = Invoice::findOrFail($request->route('invoice'));

        Gate::authorize('update', $invoice);

        $invoice->update(['status' => InvoiceStatus::Cancelled->value]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Invoice cancelled.')]);

        return to_route('ai.invoices.show', [
            'current_team' => $request->user()->currentTeam->slug,
            'invoice' => $invoice->id,
        ]);
    }
}
