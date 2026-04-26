<?php

namespace Modules\AilesInvisibles\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Modules\AilesInvisibles\Enums\QuoteStatus;
use Modules\AilesInvisibles\Http\Requests\StoreQuoteRequest;
use Modules\AilesInvisibles\Models\Client;
use Modules\AilesInvisibles\Models\Quote;
use Modules\AilesInvisibles\Services\QuoteService;

class QuoteController
{
    public function __construct(
        protected QuoteService $quoteService,
    ) {}

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Quote::class);

        $quotes = Quote::query()
            ->with('client')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (Quote $quote) => [
                'id' => $quote->id,
                'quote_number' => $quote->quote_number,
                'status' => $quote->status,
                'subject' => $quote->subject,
                'valid_until' => $quote->valid_until?->toDateString(),
                'subtotal' => (float) $quote->subtotal,
                'tax_amount' => (float) $quote->tax_amount,
                'total' => (float) $quote->total,
                'client' => $quote->client ? [
                    'id' => $quote->client->id,
                    'first_name' => $quote->client->first_name,
                    'last_name' => $quote->client->last_name,
                    'company_name' => $quote->client->company_name,
                ] : null,
                'created_at' => $quote->created_at->toISOString(),
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

        return Inertia::render('ailes-invisibles/admin/quotes/Index', [
            'quotes' => $quotes,
            'clients' => $clients,
        ]);
    }

    public function show(Request $request): Response
    {
        $quote = Quote::with(['client', 'lines', 'lines.product', 'event'])
            ->findOrFail($request->route('quote'));

        Gate::authorize('view', $quote);

        return Inertia::render('ailes-invisibles/admin/quotes/Show', [
            'quote' => [
                'id' => $quote->id,
                'quote_number' => $quote->quote_number,
                'status' => $quote->status instanceof \BackedEnum ? $quote->status->value : $quote->status,
                'subject' => $quote->subject,
                'notes' => $quote->notes,
                'valid_until' => $quote->valid_until?->toDateString(),
                'subtotal' => (float) $quote->subtotal,
                'tax_amount' => (float) $quote->tax_amount,
                'total' => (float) $quote->total,
                'client' => $quote->client ? [
                    'id' => $quote->client->id,
                    'first_name' => $quote->client->first_name,
                    'last_name' => $quote->client->last_name,
                    'company_name' => $quote->client->company_name,
                    'email' => $quote->client->email,
                    'address_line1' => $quote->client->address_line1,
                    'address_line2' => $quote->client->address_line2,
                    'city' => $quote->client->city,
                    'postal_code' => $quote->client->postal_code,
                    'country' => $quote->client->country,
                ] : null,
                'event' => $quote->event ? [
                    'id' => $quote->event->id,
                    'title' => $quote->event->title,
                ] : null,
                'lines' => $quote->lines->map(fn ($line) => [
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
                'has_invoice' => $quote->invoice()->exists(),
                'created_at' => $quote->created_at->toISOString(),
                'updated_at' => $quote->updated_at->toISOString(),
            ],
        ]);
    }

    public function store(StoreQuoteRequest $request): RedirectResponse
    {
        Gate::authorize('create', Quote::class);

        $validated = $request->validated();
        $file = $request->file('file');

        $quote = $this->quoteService->createQuote(
            $request->user()->currentTeam->id,
            $validated,
            $file,
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Quote created.')]);

        return to_route('ai.quotes.show', [
            'current_team' => $request->user()->currentTeam->slug,
            'quote' => $quote->id,
        ]);
    }

    public function update(StoreQuoteRequest $request): RedirectResponse
    {
        $quote = Quote::findOrFail($request->route('quote'));

        Gate::authorize('update', $quote);

        $validated = $request->validated();
        $file = $request->file('file');

        $this->quoteService->updateQuote($quote, $validated, $file);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Quote updated.')]);

        return to_route('ai.quotes.show', [
            'current_team' => $request->user()->currentTeam->slug,
            'quote' => $quote->id,
        ]);
    }

    public function destroy(Request $request): RedirectResponse
    {
        $quote = Quote::findOrFail($request->route('quote'));

        Gate::authorize('delete', $quote);

        $quote->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Quote deleted.')]);

        return to_route('ai.quotes.index', [
            'current_team' => $request->user()->currentTeam->slug,
        ]);
    }

    public function send(Request $request): RedirectResponse
    {
        $quote = Quote::findOrFail($request->route('quote'));

        Gate::authorize('send', $quote);

        $quote->update(['status' => QuoteStatus::Sent->value]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Quote sent.')]);

        return to_route('ai.quotes.show', [
            'current_team' => $request->user()->currentTeam->slug,
            'quote' => $quote->id,
        ]);
    }

    public function accept(Request $request): RedirectResponse
    {
        $quote = Quote::findOrFail($request->route('quote'));

        Gate::authorize('update', $quote);

        $quote->update(['status' => QuoteStatus::Accepted->value]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Quote accepted.')]);

        return to_route('ai.quotes.show', [
            'current_team' => $request->user()->currentTeam->slug,
            'quote' => $quote->id,
        ]);
    }

    public function convertToInvoice(Request $request): RedirectResponse
    {
        $quote = Quote::with('lines')->findOrFail($request->route('quote'));

        Gate::authorize('update', $quote);

        if ($quote->invoice()->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Quote already converted to invoice.')]);

            return back();
        }

        $invoice = $this->quoteService->convertToInvoice($quote);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Quote converted to invoice.')]);

        return to_route('ai.invoices.show', [
            'current_team' => $request->user()->currentTeam->slug,
            'invoice' => $invoice->id,
        ]);
    }
}
