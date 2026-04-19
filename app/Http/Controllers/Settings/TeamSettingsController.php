<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teams\SaveTeamRequest;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TeamSettingsController extends Controller
{
    /**
     * Show the team general settings page.
     */
    public function edit(Request $request): Response
    {
        $team = $request->user()->currentTeam;

        return Inertia::render('settings/team-general', [
            'team' => [
                'id' => $team->id,
                'name' => $team->name,
                'slug' => $team->slug,
                'isPersonal' => $team->is_personal,
            ],
            'permissions' => $request->user()->getAllPermissions()->pluck('name'),
        ]);
    }

    /**
     * Update the team name.
     */
    public function update(SaveTeamRequest $request): RedirectResponse
    {
        $team = $request->user()->currentTeam;

        Gate::authorize('update', $team);

        DB::transaction(function () use ($request, $team) {
            $team = Team::whereKey($team->id)->lockForUpdate()->firstOrFail();
            $team->update(['name' => $request->validated('name')]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Team updated.')]);

        return back();
    }
}
