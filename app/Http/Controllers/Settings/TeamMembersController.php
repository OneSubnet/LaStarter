<?php

namespace App\Http\Controllers\Settings;

use App\Actions\Members\MapTeamMembers;
use App\Actions\Members\RemoveTeamMember;
use App\Actions\Members\UpdateTeamMemberRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Teams\UpdateTeamMemberRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class TeamMembersController extends Controller
{
    public function index(Request $request, MapTeamMembers $mapTeamMembers): Response
    {
        $user = $request->user();
        $team = $user->currentTeam;
        $teamRoles = Role::where('team_id', $team->id)->get();

        return Inertia::render('settings/team-members', [
            'team' => [
                'id' => $team->id,
                'name' => $team->name,
                'slug' => $team->slug,
                'isPersonal' => $team->is_personal,
            ],
            'members' => $mapTeamMembers->handle($team),
            'invitations' => $team->invitations()
                ->whereNull('accepted_at')
                ->get()
                ->map(fn ($invitation) => [
                    'code' => $invitation->code,
                    'email' => $invitation->email,
                    'role' => $invitation->role instanceof \BackedEnum ? $invitation->role->value : $invitation->role,
                    'role_label' => ucfirst($invitation->role instanceof \BackedEnum ? $invitation->role->value : $invitation->role),
                    'created_at' => $invitation->created_at->toISOString(),
                ]),
            'permissions' => $user->getAllPermissions()->pluck('name'),
            'availableRoles' => $teamRoles->where('name', '!=', 'owner')->map(fn ($role) => [
                'value' => $role->name,
                'label' => ucfirst($role->name),
            ])->values()->toArray(),
        ]);
    }

    public function update(UpdateTeamMemberRequest $request, User $user, UpdateTeamMemberRole $updateRole): RedirectResponse
    {
        $team = $request->user()->currentTeam;

        Gate::authorize('updateMember', $team);

        $updateRole->handle($team, $user, $request->validated('role'));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Member role updated.')]);

        return back();
    }

    public function destroy(Request $request, User $user, RemoveTeamMember $removeMember): RedirectResponse
    {
        $team = $request->user()->currentTeam;

        Gate::authorize('removeMember', $team);

        abort_if($team->owner()?->is($user), 403, __('The team owner cannot be removed.'));

        $removeMember->handle($team, $user);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Member removed.')]);

        return back();
    }
}
