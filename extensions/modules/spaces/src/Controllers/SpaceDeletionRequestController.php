<?php

namespace Modules\Spaces\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Spaces\Models\SpaceDeletionRequest;

class SpaceDeletionRequestController
{
    public function request(Request $request): RedirectResponse
    {
        Gate::authorize('create', SpaceDeletionRequest::class);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        $existing = SpaceDeletionRequest::where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            Inertia\Inertia::flash('toast', ['type' => 'error', 'message' => __('You already have a pending deletion request.')]);

            return back();
        }

        SpaceDeletionRequest::create([
            'user_id' => $request->user()->id,
            'reason' => $validated['reason'],
            'status' => 'pending',
            'hold_until' => now()->addDays(30),
        ]);

        Inertia\Inertia::flash('toast', ['type' => 'success', 'message' => __('Deletion request submitted.')]);

        return back();
    }

    public function cancel(Request $request): RedirectResponse
    {
        $deletionRequest = SpaceDeletionRequest::findOrFail((int) $request->route('deletion_request'));

        Gate::authorize('delete', $deletionRequest);

        if ($deletionRequest->status !== 'pending') {
            Inertia\Inertia::flash('toast', ['type' => 'error', 'message' => __('Only pending requests can be cancelled.')]);

            return back();
        }

        $deletionRequest->update(['status' => 'cancelled']);

        Inertia\Inertia::flash('toast', ['type' => 'success', 'message' => __('Deletion request cancelled.')]);

        return back();
    }

    public function review(Request $request): RedirectResponse
    {
        Gate::authorize('review', SpaceDeletionRequest::class);

        $deletionRequest = SpaceDeletionRequest::findOrFail((int) $request->route('deletion_request'));

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:approved,rejected'],
        ]);

        $deletionRequest->update([
            'status' => $validated['status'],
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        Inertia\Inertia::flash('toast', ['type' => 'success', 'message' => __('Deletion request :status.', ['status' => $validated['status']])]);

        return back();
    }
}
