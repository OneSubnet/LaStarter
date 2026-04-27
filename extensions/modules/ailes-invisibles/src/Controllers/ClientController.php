<?php

namespace Modules\AilesInvisibles\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Modules\AilesInvisibles\Http\Requests\StoreClientRequest;
use Modules\AilesInvisibles\Http\Requests\UpdateClientRequest;
use Modules\AilesInvisibles\Models\Client;
use Modules\AilesInvisibles\Models\ClientUser;
use Modules\AilesInvisibles\Notifications\ClientPortalInvitation;

class ClientController
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Client::class);

        $clients = Client::query()
            ->withCount(['events', 'quotes', 'invoices', 'documents'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (Client $client) => [
                'id' => $client->id,
                'type' => $client->type->value,
                'first_name' => $client->first_name,
                'last_name' => $client->last_name,
                'email' => $client->email,
                'phone' => $client->phone,
                'company_name' => $client->company_name,
                'vat_number' => $client->vat_number,
                'status' => $client->status->value,
                'events_count' => $client->events_count,
                'quotes_count' => $client->quotes_count,
                'invoices_count' => $client->invoices_count,
                'documents_count' => $client->documents_count,
                'has_portal' => $client->portalUser()->exists(),
                'created_at' => $client->created_at->toISOString(),
            ]);

        return Inertia::render('ailes-invisibles/admin/clients/Index', [
            'clients' => $clients,
        ]);
    }

    public function show(Request $request): Response
    {
        $client = Client::findOrFail($request->route('client'));

        Gate::authorize('view', $client);

        $client->loadCount(['events', 'quotes', 'invoices', 'documents']);

        $events = $client->events()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($event) => [
                'id' => $event->id,
                'title' => $event->title,
                'type' => $event->type,
                'status' => $event->status,
                'start_date' => $event->start_date?->toISOString(),
            ]);

        $quotes = $client->quotes()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($quote) => [
                'id' => $quote->id,
                'quote_number' => $quote->quote_number,
                'status' => $quote->status,
                'total' => (float) $quote->total,
                'created_at' => $quote->created_at->toISOString(),
            ]);

        $invoices = $client->invoices()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($invoice) => [
                'id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'status' => $invoice->status,
                'total' => (float) $invoice->total,
                'paid_amount' => (float) $invoice->paid_amount,
                'created_at' => $invoice->created_at->toISOString(),
            ]);

        $portalUser = $client->portalUser;

        return Inertia::render('ailes-invisibles/admin/clients/Show', [
            'client' => [
                'id' => $client->id,
                'type' => $client->type->value,
                'first_name' => $client->first_name,
                'last_name' => $client->last_name,
                'email' => $client->email,
                'phone' => $client->phone,
                'company_name' => $client->company_name,
                'vat_number' => $client->vat_number,
                'vat_country' => $client->vat_country,
                'address_line1' => $client->address_line1,
                'address_line2' => $client->address_line2,
                'city' => $client->city,
                'postal_code' => $client->postal_code,
                'country' => $client->country,
                'notes' => $client->notes,
                'status' => $client->status->value,
                'slug' => $client->slug,
                'metadata' => $client->metadata,
                'events_count' => $client->events_count,
                'quotes_count' => $client->quotes_count,
                'invoices_count' => $client->invoices_count,
                'documents_count' => $client->documents_count,
                'has_portal' => $portalUser !== null,
                'portal_last_login' => $portalUser?->last_login_at?->toISOString(),
                'created_at' => $client->created_at->toISOString(),
                'updated_at' => $client->updated_at->toISOString(),
            ],
            'events' => $events,
            'quotes' => $quotes,
            'invoices' => $invoices,
        ]);
    }

    public function store(StoreClientRequest $request): RedirectResponse
    {
        Gate::authorize('create', Client::class);

        $client = Client::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Client created.')]);

        return to_route('ai.clients.show', [
            'current_team' => $request->user()->currentTeam->slug,
            'client' => $client->id,
        ]);
    }

    public function update(UpdateClientRequest $request): RedirectResponse
    {
        $client = Client::findOrFail($request->route('client'));

        Gate::authorize('update', $client);

        $client->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Client updated.')]);

        return to_route('ai.clients.show', [
            'current_team' => $request->user()->currentTeam->slug,
            'client' => $client->id,
        ]);
    }

    public function destroy(Request $request): RedirectResponse
    {
        $client = Client::findOrFail($request->route('client'));

        Gate::authorize('delete', $client);

        $client->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Client deleted.')]);

        return to_route('ai.clients.index', [
            'current_team' => $request->user()->currentTeam->slug,
        ]);
    }

    public function invitePortal(Request $request): RedirectResponse
    {
        $client = Client::findOrFail($request->route('client'));

        Gate::authorize('update', $client);

        $portalUser = ClientUser::where('email', $client->email)->first();
        $accessToken = ClientUser::generateAccessToken();

        if ($portalUser) {
            $portalUser->update([
                'access_token' => $accessToken,
                'client_id' => $client->id,
                'team_id' => $client->team_id,
            ]);
        } else {
            $portalUser = ClientUser::create([
                'team_id' => $client->team_id,
                'client_id' => $client->id,
                'email' => $client->email,
                'password' => Str::random(32),
                'name' => $client->fullName(),
                'access_token' => $accessToken,
            ]);
        }

        $portalUser->notify(
            (new ClientPortalInvitation($client, $client->team, $accessToken))
                ->locale($request->user()->locale ?? app()->getLocale())
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Portal invitation sent to :email.', ['email' => $client->email]),
        ]);

        return back();
    }
}
