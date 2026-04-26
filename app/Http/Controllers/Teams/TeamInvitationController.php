<?php

namespace App\Http\Controllers\Teams;

use App\Actions\Invitations\AcceptTeamInvitation;
use App\Actions\Invitations\CreateTeamInvitation;
use App\Concerns\PasswordValidationRules;
use App\Http\Controllers\Controller;
use App\Http\Requests\Teams\AcceptTeamInvitationRequest;
use App\Http\Requests\Teams\CreateTeamInvitationRequest;
use App\Models\TeamInvitation;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class TeamInvitationController extends Controller
{
    use PasswordValidationRules;

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

    public function show(Request $request)
    {
        $invitation = TeamInvitation::where('code', $request->route('invitation_code'))
            ->with('team')
            ->first();

        if (! $invitation) {
            abort(404, __('Invitation not found'));
        }

        if ($invitation->isAccepted()) {
            return redirect()->route('home');
        }

        if ($invitation->isExpired()) {
            return redirect()->route('home')->with('error', __('This invitation has expired.'));
        }

        if ($request->user()) {
            return redirect()->route('invitations.accept', ['invitation_code' => $invitation->code]);
        }

        $team = $invitation->team;

        return Inertia::render('invitations/accept', [
            'invitation' => [
                'code' => $invitation->code,
                'email' => $invitation->email,
                'role' => $invitation->role?->value ?? $invitation->role,
            ],
            'team' => [
                'name' => $team->name,
                'icon_url' => $team->iconUrl(),
            ],
            'inviter' => $invitation->inviter ? [
                'name' => $invitation->inviter->name,
            ] : null,
        ]);
    }

    public function register(Request $request, AcceptTeamInvitation $acceptInvitation)
    {
        $invitation = TeamInvitation::where('code', $request->route('invitation_code'))
            ->with('team')
            ->first();

        if (! $invitation || $invitation->isAccepted() || $invitation->isExpired()) {
            abort(410, __('This invitation is no longer valid.'));
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', Password::default()],
        ]);

        if (strtolower($validated['email']) !== strtolower($invitation->email)) {
            return back()->withErrors(['email' => __('This email does not match the invitation.')]);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        auth()->login($user);

        $acceptInvitation->handle($user, $invitation);

        return redirect()->route('dashboard', ['current_team' => $invitation->team->slug]);
    }

    public function accept(AcceptTeamInvitationRequest $request, AcceptTeamInvitation $acceptInvitation): RedirectResponse
    {
        $invitation = TeamInvitation::where('code', $request->route('invitation_code'))->firstOrFail();

        $acceptInvitation->handle($request->user(), $invitation);

        return to_route('dashboard', ['current_team' => $invitation->team->slug]);
    }
}
