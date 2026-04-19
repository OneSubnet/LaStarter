<?php

namespace App\Http\Controllers\Teams;

use App\Actions\Members\MapTeamMembers;
use App\Actions\Teams\CreateTeam;
use App\Actions\Teams\DeleteTeam;
use App\Actions\Teams\UpdateTeam;
use App\Http\Controllers\Controller;
use App\Http\Requests\Teams\DeleteTeamRequest;
use App\Http\Requests\Teams\SaveTeamRequest;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class TeamController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('settings/teams', [
            'teams' => $request->user()->toUserTeams(includeCurrent: true),
        ]);
    }

    public function store(SaveTeamRequest $request, CreateTeam $createTeam): RedirectResponse
    {
        $team = $createTeam->handle($request->user(), $request->validated('name'));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Team created.')]);

        return to_route('settings.team.general', ['current_team' => $team->slug]);
    }

    public function edit(Request $request, Team $team, MapTeamMembers $mapTeamMembers): Response
    {
        $user = $request->user();
        $teamRoles = Role::where('team_id', $team->id)->get();

        return Inertia::render('teams/edit', [
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

    public function update(SaveTeamRequest $request, Team $team, UpdateTeam $updateTeam): RedirectResponse
    {
        Gate::authorize('update', $team);

        $team = $updateTeam->handle($team, $request->validated('name'));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Team updated.')]);

        return to_route('settings.team.general', ['current_team' => $team->slug]);
    }

    public function switch(Request $request, Team $team): RedirectResponse
    {
        abort_unless($request->user()->belongsToTeam($team), 403);

        $request->user()->switchTeam($team);

        return to_route('dashboard', ['current_team' => $team->slug]);
    }

    public function destroy(DeleteTeamRequest $request, DeleteTeam $deleteTeam): RedirectResponse
    {
        $team = $request->route('current_team');

        $deleteTeam->handle($request->user(), $team);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Team deleted.')]);

        return to_route('settings.teams.index', ['current_team' => $request->user()->currentTeam->slug]);
    }
}
