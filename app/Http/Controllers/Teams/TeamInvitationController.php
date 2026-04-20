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
use Inertia\Inertia;

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

    public function destroy(Request $request): RedirectResponse
    {
        $team = $request->user()->currentTeam;

        $invitation = TeamInvitation::where('code', $request->route('invitation_code'))->first();

        if (! $invitation) {
            abort(404, __('Invitation not found'));
        }

        abort_unless($invitation->team_id === $team->id, 404);

        Gate::authorize('cancelInvitation', $team);

        $invitation->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Invitation cancelled.')]);

        return back();
    }

    public function accept(AcceptTeamInvitationRequest $request, AcceptTeamInvitation $acceptInvitation): RedirectResponse
    {
        $invitation = TeamInvitation::where('code', $request->route('invitation_code'))->firstOrFail();

        $acceptInvitation->handle($request->user(), $invitation);

        return to_route('dashboard', ['current_team' => $invitation->team->slug]);
    }
}
