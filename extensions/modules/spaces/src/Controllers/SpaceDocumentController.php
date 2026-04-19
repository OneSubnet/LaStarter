<?php

namespace Modules\Spaces\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Modules\Spaces\Models\Space;
use Modules\Spaces\Models\SpaceActivityLog;
use Modules\Spaces\Models\SpaceDocument;
use Modules\Spaces\Models\SpaceDocumentAssignment;
use Modules\Spaces\Models\SpaceDocumentSignature;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SpaceDocumentController
{
    public function upload(Request $request): RedirectResponse
    {
        $space = Space::findOrFail((int) $request->route('space'));

        Gate::authorize('upload', SpaceDocument::class);

        $validated = $request->validate([
            'file' => ['required', 'file', 'max:25600', 'mimes:pdf,doc,docx,xls,xlsx,png,jpg,jpeg'],
            'name' => ['required', 'string', 'max:255'],
            'instructions' => ['nullable', 'string'],
            'requires_signature' => ['sometimes', 'boolean'],
        ]);

        $file = $request->file('file');
        $filePath = $file->store("spaces/{$space->id}");

        $document = SpaceDocument::create([
            'space_id' => $space->id,
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'file_path' => $filePath,
            'file_type' => $file->getClientOriginalExtension(),
            'file_size' => $file->getSize(),
            'status' => 'active',
            'requires_signature' => $validated['requires_signature'] ?? false,
            'instructions' => $validated['instructions'] ?? null,
        ]);

        SpaceActivityLog::create([
            'space_id' => $space->id,
            'user_id' => $request->user()->id,
            'action' => 'document.uploaded',
            'subject_type' => SpaceDocument::class,
            'subject_id' => $document->id,
            'properties' => ['name' => $document->name],
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Document uploaded.')]);

        return back();
    }

    public function assign(Request $request): RedirectResponse
    {
        $space = Space::findOrFail((int) $request->route('space'));
        $document = SpaceDocument::where('space_id', $space->id)
            ->findOrFail((int) $request->route('document'));

        Gate::authorize('requestSignature', $document);

        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'action' => ['required', 'string', 'in:review,sign,download'],
            'notes' => ['nullable', 'string'],
        ]);

        SpaceDocumentAssignment::create([
            'document_id' => $document->id,
            'user_id' => $validated['user_id'],
            'action' => $validated['action'],
            'status' => 'pending',
            'notes' => $validated['notes'] ?? null,
        ]);

        SpaceActivityLog::create([
            'space_id' => $space->id,
            'user_id' => $request->user()->id,
            'action' => 'document.assigned',
            'subject_type' => SpaceDocument::class,
            'subject_id' => $document->id,
            'properties' => [
                'assigned_to' => $validated['user_id'],
                'action' => $validated['action'],
            ],
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Document assigned.')]);

        return back();
    }

    public function sign(Request $request): RedirectResponse
    {
        $space = Space::findOrFail((int) $request->route('space'));
        $document = SpaceDocument::where('space_id', $space->id)
            ->findOrFail((int) $request->route('document'));

        Gate::authorize('sign', $document);

        $validated = $request->validate([
            'signature_data' => ['required', 'string'],
        ]);

        $assignment = SpaceDocumentAssignment::where('document_id', $document->id)
            ->where('user_id', $request->user()->id)
            ->where('action', 'sign')
            ->where('status', 'pending')
            ->firstOrFail();

        SpaceDocumentSignature::create([
            'document_id' => $document->id,
            'user_id' => $request->user()->id,
            'signature_data' => $validated['signature_data'],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'signed_at' => now(),
        ]);

        $assignment->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        SpaceActivityLog::create([
            'space_id' => $space->id,
            'user_id' => $request->user()->id,
            'action' => 'document.signed',
            'subject_type' => SpaceDocument::class,
            'subject_id' => $document->id,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Document signed.')]);

        return back();
    }

    public function download(Request $request): StreamedResponse
    {
        $space = Space::findOrFail((int) $request->route('space'));
        $document = SpaceDocument::where('space_id', $space->id)
            ->findOrFail((int) $request->route('document'));

        Gate::authorize('view', $document);

        return Storage::download($document->file_path, $document->name . '.' . $document->file_type);
    }

    public function destroy(Request $request): RedirectResponse
    {
        $space = Space::findOrFail((int) $request->route('space'));
        $document = SpaceDocument::where('space_id', $space->id)
            ->findOrFail((int) $request->route('document'));

        Gate::authorize('delete', $document);

        SpaceActivityLog::create([
            'space_id' => $space->id,
            'user_id' => $request->user()->id,
            'action' => 'document.deleted',
            'subject_type' => SpaceDocument::class,
            'subject_id' => $document->id,
            'properties' => ['name' => $document->name],
        ]);

        $document->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Document deleted.')]);

        return back();
    }
}
