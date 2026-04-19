<?php

namespace App\Http\Controllers\Teams;

use App\Actions\Members\RemoveTeamMember;
use App\Actions\Members\UpdateTeamMemberRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Teams\UpdateTeamMemberRequest;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class TeamMemberController extends Controller
{
    public function update(UpdateTeamMemberRequest $request, Team $team, User $user, UpdateTeamMemberRole $updateRole): RedirectResponse
    {
        Gate::authorize('updateMember', $team);

        $updateRole->handle($team, $user, $request->validated('role'));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Member role updated.')]);

        return to_route('teams.edit', ['team' => $team->slug]);
    }

    public function destroy(Team $team, User $user, RemoveTeamMember $removeMember): RedirectResponse
    {
        Gate::authorize('removeMember', $team);

        abort_if($team->owner()?->is($user), 403, __('The team owner cannot be removed.'));

        $removeMember->handle($team, $user);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Member removed.')]);

        return to_route('teams.edit', ['team' => $team->slug]);
    }
}
