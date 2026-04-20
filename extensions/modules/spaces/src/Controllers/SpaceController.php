<?php

namespace Modules\Spaces\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Spaces\Http\Requests\StoreSpaceRequest;
use Modules\Spaces\Http\Requests\UpdateSpaceRequest;
use Modules\Spaces\Models\Space;
use Modules\Spaces\Models\SpaceActivityLog;
use Modules\Spaces\Models\SpaceMember;

class SpaceController
{
    use ResolvesSpace;

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Space::class);

        $spaces = Space::query()
            ->withCount(['members', 'documents'])
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(fn (Space $space) => [
                'id' => $space->id,
                'name' => $space->name,
                'slug' => $space->slug,
                'description' => $space->description,
                'visibility' => $space->visibility,
                'members_count' => $space->members_count,
                'documents_count' => $space->documents_count,
                'created_at' => $space->created_at->toISOString(),
            ]);

        return Inertia::render('spaces/Index', [
            'spaces' => $spaces,
        ]);
    }

    public function show(Request $request): Response
    {
        $space = $this->resolveSpace($request);

        Gate::authorize('view', $space);

        $members = $space->members()
            ->with('user')
            ->get()
            ->map(fn (SpaceMember $member) => [
                'id' => $member->id,
                'user_id' => $member->user_id,
                'name' => $member->user->name,
                'email' => $member->user->email,
                'role' => $member->role,
                'permissions' => $member->permissions,
                'joined_at' => $member->joined_at?->toISOString(),
            ]);

        $documents = $space->documents()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($document) => [
                'id' => $document->id,
                'name' => $document->name,
                'file_type' => $document->file_type,
                'file_size' => $document->file_size,
                'status' => $document->status,
                'requires_signature' => $document->requires_signature,
                'expires_at' => $document->expires_at?->toISOString(),
                'created_at' => $document->created_at->toISOString(),
            ]);

        $activityLog = $space->activityLog()
            ->with('user')
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn (SpaceActivityLog $log) => [
                'id' => $log->id,
                'user' => $log->user?->name,
                'action' => $log->action,
                'subject_type' => $log->subject_type,
                'subject_id' => $log->subject_id,
                'properties' => $log->properties,
                'created_at' => $log->created_at->toISOString(),
            ]);

        return Inertia::render('spaces/Show', [
            'space' => [
                'id' => $space->id,
                'name' => $space->name,
                'slug' => $space->slug,
                'description' => $space->description,
                'visibility' => $space->visibility,
                'settings' => $space->settings,
                'created_at' => $space->created_at->toISOString(),
                'updated_at' => $space->updated_at->toISOString(),
            ],
            'members' => $members,
            'documents' => $documents,
            'activityLog' => $activityLog,
        ]);
    }

    public function store(StoreSpaceRequest $request): RedirectResponse
    {
        Gate::authorize('create', Space::class);

        $space = Space::create([
            'name' => $request->validated('name'),
            'slug' => Str::slug($request->validated('name')),
            'description' => $request->validated('description'),
            'visibility' => $request->validated('visibility', 'restricted'),
        ]);

        SpaceMember::create([
            'space_id' => $space->id,
            'user_id' => $request->user()->id,
            'role' => SpaceMember::ROLE_ADMIN,
            'joined_at' => now(),
        ]);

        SpaceActivityLog::create([
            'space_id' => $space->id,
            'user_id' => $request->user()->id,
            'action' => 'space.created',
            'subject_type' => Space::class,
            'subject_id' => $space->id,
            'properties' => ['name' => $space->name],
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Space created.')]);

        return to_route('spaces.show', [
            'current_team' => $request->route('current_team'),
            'space' => $space->id,
        ]);
    }

    public function update(UpdateSpaceRequest $request): RedirectResponse
    {
        $space = $this->resolveSpace($request);

        Gate::authorize('update', $space);

        $space->update($request->validated());

        SpaceActivityLog::create([
            'space_id' => $space->id,
            'user_id' => $request->user()->id,
            'action' => 'space.updated',
            'subject_type' => Space::class,
            'subject_id' => $space->id,
            'properties' => $request->validated(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Space updated.')]);

        return to_route('spaces.show', [
            'current_team' => $request->route('current_team'),
            'space' => $space->id,
        ]);
    }

    public function destroy(Request $request): RedirectResponse
    {
        $space = $this->resolveSpace($request);

        Gate::authorize('delete', $space);

        SpaceActivityLog::create([
            'space_id' => $space->id,
            'user_id' => $request->user()->id,
            'action' => 'space.deleted',
            'subject_type' => Space::class,
            'subject_id' => $space->id,
            'properties' => ['name' => $space->name],
        ]);

        $space->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Space deleted.')]);

        return to_route('spaces.index', ['current_team' => $request->route('current_team')]);
    }

    public function addMember(Request $request): RedirectResponse
    {
        $space = $this->resolveSpace($request);

        Gate::authorize('manageMembers', $space);

        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'exists:users,email'],
            'role' => ['sometimes', 'string', 'in:admin,member,viewer'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        $existingMember = SpaceMember::where('space_id', $space->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existingMember) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('User is already a member of this space.')]);

            return back();
        }

        SpaceMember::create([
            'space_id' => $space->id,
            'user_id' => $user->id,
            'role' => $validated['role'] ?? SpaceMember::ROLE_MEMBER,
            'joined_at' => now(),
        ]);

        SpaceActivityLog::create([
            'space_id' => $space->id,
            'user_id' => $request->user()->id,
            'action' => 'member.added',
            'subject_type' => User::class,
            'subject_id' => $user->id,
            'properties' => ['email' => $user->email, 'role' => $validated['role'] ?? SpaceMember::ROLE_MEMBER],
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Member added.')]);

        return back();
    }

    public function removeMember(Request $request): RedirectResponse
    {
        $space = $this->resolveSpace($request);

        Gate::authorize('manageMembers', $space);

        $userId = (int) $request->route('user');

        $member = SpaceMember::where('space_id', $space->id)
            ->where('user_id', $userId)
            ->firstOrFail();

        SpaceActivityLog::create([
            'space_id' => $space->id,
            'user_id' => $request->user()->id,
            'action' => 'member.removed',
            'subject_type' => User::class,
            'subject_id' => $userId,
        ]);

        $member->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Member removed.')]);

        return back();
    }
}
