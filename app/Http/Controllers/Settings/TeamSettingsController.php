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
            'footerLinks' => json_decode(setting('footer_links') ?? '[]', true),
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
            $locked = Team::whereKey($team->id)->lockForUpdate()->firstOrFail();
            $locked->update(['name' => $request->validated('name')]);
        });

        $team->refresh();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Team updated.')]);

        return to_route('settings.team.general', ['current_team' => $team->slug]);
    }

    /**
     * Upload or update the team icon.
     */
    public function updateIcon(Request $request): RedirectResponse
    {
        $team = $request->user()->currentTeam;

        Gate::authorize('update', $team);

        $validated = $request->validate([
            'icon' => ['required', 'image', 'mimes:jpeg,png,webp,svg', 'max:5120'],
        ]);

        $file = $validated['icon'];

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

    /**
     * Update footer links.
     */
    public function updateFooterLinks(Request $request): RedirectResponse
    {
        $team = $request->user()->currentTeam;

        Gate::authorize('update', $team);

        $links = $request->validate([
            'links' => ['present', 'array'],
            'links.*.title' => ['required_with:links.*.href', 'string', 'max:255'],
            'links.*.href' => ['required_with:links.*.title', 'string', 'max:500'],
        ])['links'];

        $links = array_values(array_filter($links, fn ($l) => ! empty($l['title']) && ! empty($l['href'])));

        setting_set('footer_links', json_encode($links));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Footer links updated.')]);

        return back();
    }
}
