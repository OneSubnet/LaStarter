<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teams\SaveTeamRequest;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
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
                'icon_url' => $team->iconUrl(),
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

    /**
     * Upload or update the team icon.
     */
    public function updateIcon(Request $request): RedirectResponse
    {
        $team = $request->user()->currentTeam;

        Gate::authorize('update', $team);

        $file = $request->file('icon');

        if (! $file) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('No file selected.')]);

            return back();
        }

        if (! $file->isValid()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Upload failed: ').$file->getErrorMessage()]);

            return back();
        }

        $allowed = ['jpg', 'jpeg', 'png', 'webp', 'svg'];
        $ext = strtolower($file->getClientOriginalExtension());

        if (! in_array($ext, $allowed)) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Invalid file type. Allowed: jpg, png, webp, svg')]);

            return back();
        }

        if ($file->getSize() > 5 * 1024 * 1024) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('File too large. Max 5MB.')]);

            return back();
        }

        // Delete old icon
        if ($team->icon_path) {
            Storage::disk('public')->delete($team->icon_path);
        }

        $path = $file->store("teams/{$team->id}", 'public');

        $team->update(['icon_path' => $path]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Team icon updated.')]);

        return back();
    }

    /**
     * Remove the team icon.
     */
    public function removeIcon(Request $request): RedirectResponse
    {
        $team = $request->user()->currentTeam;

        Gate::authorize('update', $team);

        if ($team->icon_path) {
            Storage::disk('public')->delete($team->icon_path);
            $team->update(['icon_path' => null]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Team icon removed.')]);

        return back();
    }
}
