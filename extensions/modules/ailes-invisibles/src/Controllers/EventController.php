<?php

namespace Modules\AilesInvisibles\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Modules\AilesInvisibles\Http\Requests\StoreEventRequest;
use Modules\AilesInvisibles\Models\Client;
use Modules\AilesInvisibles\Models\Event;

class EventController
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Event::class);

        $events = Event::query()
            ->with('client')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (Event $event) => [
                'id' => $event->id,
                'title' => $event->title,
                'slug' => $event->slug,
                'type' => $event->type,
                'status' => $event->status,
                'client' => $event->client ? [
                    'id' => $event->client->id,
                    'first_name' => $event->client->first_name,
                    'last_name' => $event->client->last_name,
                    'company_name' => $event->client->company_name,
                ] : null,
                'start_date' => $event->start_date?->toISOString(),
                'end_date' => $event->end_date?->toISOString(),
                'location' => $event->location,
                'created_at' => $event->created_at->toISOString(),
            ]);

        $clients = Client::query()
            ->where('team_id', $request->user()->currentTeam->id)
            ->orderBy('last_name')
            ->get()
            ->map(fn (Client $client) => [
                'id' => $client->id,
                'first_name' => $client->first_name,
                'last_name' => $client->last_name,
                'company_name' => $client->company_name,
                'type' => $client->type,
            ]);

        return Inertia::render('ailes-invisibles/admin/events/Index', [
            'events' => $events,
            'clients' => $clients,
        ]);
    }

    public function show(Request $request): Response
    {
        $event = Event::with(['client', 'quotes', 'invoices'])
            ->findOrFail($request->route('event'));

        Gate::authorize('view', $event);

        return Inertia::render('ailes-invisibles/admin/events/Show', [
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'slug' => $event->slug,
                'description' => $event->description,
                'type' => $event->type,
                'status' => $event->status,
                'location' => $event->location,
                'start_date' => $event->start_date?->toISOString(),
                'end_date' => $event->end_date?->toISOString(),
                'form_id' => $event->form_id,
                'metadata' => $event->metadata,
                'client' => $event->client ? [
                    'id' => $event->client->id,
                    'first_name' => $event->client->first_name,
                    'last_name' => $event->client->last_name,
                    'company_name' => $event->client->company_name,
                ] : null,
                'quotes' => $event->quotes->map(fn ($quote) => [
                    'id' => $quote->id,
                    'quote_number' => $quote->quote_number,
                    'status' => $quote->status,
                    'total' => (float) $quote->total,
                ]),
                'invoices' => $event->invoices->map(fn ($invoice) => [
                    'id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number,
                    'status' => $invoice->status,
                    'total' => (float) $invoice->total,
                ]),
                'created_at' => $event->created_at->toISOString(),
                'updated_at' => $event->updated_at->toISOString(),
            ],
        ]);
    }

    public function store(StoreEventRequest $request): RedirectResponse
    {
        Gate::authorize('create', Event::class);

        $event = Event::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Event created.')]);

        return to_route('ai.events.show', [
            'current_team' => $request->user()->currentTeam->slug,
            'event' => $event->id,
        ]);
    }

    public function update(StoreEventRequest $request): RedirectResponse
    {
        $event = Event::findOrFail($request->route('event'));

        Gate::authorize('update', $event);

        $event->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Event updated.')]);

        return to_route('ai.events.show', [
            'current_team' => $request->user()->currentTeam->slug,
            'event' => $event->id,
        ]);
    }

    public function destroy(Request $request): RedirectResponse
    {
        $event = Event::findOrFail($request->route('event'));

        Gate::authorize('delete', $event);

        $event->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Event deleted.')]);

        return to_route('ai.events.index', [
            'current_team' => $request->user()->currentTeam->slug,
        ]);
    }
}
