<?php

namespace Modules\AilesInvisibles\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Modules\AilesInvisibles\Models\Client;
use Modules\AilesInvisibles\Models\PortalDocument;
use Modules\AilesInvisibles\Services\NextcloudStorageService;

class DocumentController
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', PortalDocument::class);

        $documents = PortalDocument::query()
            ->with(['client', 'uploader'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (PortalDocument $document) => [
                'id' => $document->id,
                'title' => $document->title,
                'file_type' => $document->file_type,
                'file_size' => $document->file_size,
                'category' => $document->category,
                'status' => $document->status,
                'requires_signature' => $document->requires_signature,
                'is_signed' => $document->isSigned(),
                'expires_at' => $document->expires_at?->toISOString(),
                'client' => $document->client ? [
                    'id' => $document->client->id,
                    'first_name' => $document->client->first_name,
                    'last_name' => $document->client->last_name,
                    'company_name' => $document->client->company_name,
                ] : null,
                'uploader' => $document->uploader ? [
                    'id' => $document->uploader->id,
                    'name' => $document->uploader->name,
                ] : null,
                'created_at' => $document->created_at->toISOString(),
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

        return Inertia::render('ailes-invisibles/admin/documents/Index', [
            'documents' => $documents,
            'clients' => $clients,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('upload', PortalDocument::class);

        $validated = $request->validate([
            'client_id' => ['required', 'exists:ai_clients,id'],
            'title' => ['required', 'string', 'max:255'],
            'file' => ['required', 'file', 'max:51200'],
            'category' => ['nullable', 'string', 'max:255'],
            'requires_signature' => ['nullable', 'boolean'],
            'instructions' => ['nullable', 'string'],
            'expires_at' => ['nullable', 'date'],
        ]);

        $file = $request->file('file');

        $nextcloud = app(NextcloudStorageService::class);
        $teamSlug = $request->user()->currentTeam?->slug ?? 'default';

        if ($nextcloud->isConfigured()) {
            $content = file_get_contents($file->getRealPath());
            $remotePath = $nextcloud->upload(
                'portal-documents/'.uniqid().'_'.$file->getClientOriginalName(),
                $content,
                $teamSlug
            );
            $filePath = 'nextcloud:'.$remotePath;
        } else {
            $filePath = $file->store('portal-documents', 'local');
        }

        PortalDocument::create([
            'client_id' => $validated['client_id'],
            'uploaded_by' => $request->user()->id,
            'title' => $validated['title'],
            'file_path' => $filePath,
            'file_type' => $file->getClientOriginalExtension(),
            'file_size' => $file->getSize(),
            'category' => $validated['category'] ?? null,
            'status' => 'uploaded',
            'requires_signature' => $validated['requires_signature'] ?? false,
            'instructions' => $validated['instructions'] ?? null,
            'expires_at' => $validated['expires_at'] ?? null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Document uploaded.')]);

        return to_route('ai.documents.index', [
            'current_team' => $request->user()->currentTeam->slug,
        ]);
    }

    public function show(Request $request): Response
    {
        $document = PortalDocument::with(['client', 'uploader', 'signatures'])
            ->findOrFail($request->route('document'));

        Gate::authorize('view', $document);

        return Inertia::render('ailes-invisibles/admin/documents/Show', [
            'document' => [
                'id' => $document->id,
                'title' => $document->title,
                'file_type' => $document->file_type,
                'file_size' => $document->file_size,
                'category' => $document->category,
                'status' => $document->status,
                'requires_signature' => $document->requires_signature,
                'instructions' => $document->instructions,
                'expires_at' => $document->expires_at?->toISOString(),
                'client' => $document->client ? [
                    'id' => $document->client->id,
                    'first_name' => $document->client->first_name,
                    'last_name' => $document->client->last_name,
                    'company_name' => $document->client->company_name,
                ] : null,
                'uploader' => $document->uploader ? [
                    'id' => $document->uploader->id,
                    'name' => $document->uploader->name,
                ] : null,
                'signatures' => $document->signatures->map(fn ($sig) => [
                    'id' => $sig->id,
                    'signer_type' => $sig->signer_type,
                    'signer_id' => $sig->signer_id,
                    'signed_at' => $sig->signed_at?->toISOString(),
                ]),
                'created_at' => $document->created_at->toISOString(),
                'updated_at' => $document->updated_at->toISOString(),
            ],
        ]);
    }

    public function destroy(Request $request): RedirectResponse
    {
        $document = PortalDocument::findOrFail($request->route('document'));

        Gate::authorize('delete', $document);

        $document->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Document deleted.')]);

        return to_route('ai.documents.index', [
            'current_team' => $request->user()->currentTeam->slug,
        ]);
    }

    public function download(Request $request)
    {
        $document = PortalDocument::findOrFail($request->route('document'));

        Gate::authorize('view', $document);

        if (str_starts_with($document->file_path, 'nextcloud:')) {
            $remotePath = substr($document->file_path, strlen('nextcloud:'));
            $nextcloud = app(NextcloudStorageService::class);
            $tempPath = $nextcloud->downloadToTemp($remotePath);

            return response()->download($tempPath, $document->title.'.'.$document->file_type)->deleteFileAfterSend();
        }

        return response()->download(
            Storage::disk('local')->path($document->file_path),
            $document->title.'.'.$document->file_type
        );
    }
}
