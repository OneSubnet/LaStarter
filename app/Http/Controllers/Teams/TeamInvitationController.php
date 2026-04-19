<?php

namespace App\Http\Controllers\Teams;

use App\Actions\Invitations\AcceptTeamInvitation;
use App\Actions\Invitations\CreateTeamInvitation;
use App\Http\Controllers\Controller;
use App\Http\Requests\Teams\AcceptTeamInvitationRequest;
use App\Http\Requests\Teams\CreateTeamInvitationRequest;
use App\Models\TeamInvitation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TeamInvitationController extends Controller
{
    public function store(CreateTeamInvitationRequest $request, CreateTeamInvitation $createInvitation): RedirectResponse
    {
        $team = $request->user()->currentTeam;

        Gate::authorize('inviteMember', $team);

        $createInvitation->handle(
            $team,
            $request->validated('email'),
            $request->validated('role'),
            $request->user()->id,
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Invitation sent.')]);

        return back();
    }

    public function destroy(Request $request, TeamInvitation $invitation): RedirectResponse
    {
        $team = $request->user()->currentTeam;

        abort_unless($invitation->team_id === $team->id, 404);

        Gate::authorize('cancelInvitation', $team);

        $invitation->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Invitation cancelled.')]);

        return back();
    }

    public function accept(AcceptTeamInvitationRequest $request, TeamInvitation $invitation, AcceptTeamInvitation $acceptInvitation): RedirectResponse
    {
        $acceptInvitation->handle($request->user(), $invitation);

        return to_route('dashboard', ['current_team' => $invitation->team->slug]);
    }
}
