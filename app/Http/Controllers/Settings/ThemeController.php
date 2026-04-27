<?php

namespace App\Http\Controllers\Settings;

use App\Core\Extensions\ExtensionManager;
use App\Core\Themes\ComponentResolver;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateTeamThemeRequest;
use App\Models\TeamSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ThemeController extends Controller
{
    public function __construct(
        private ExtensionManager $extensions,
        private ComponentResolver $resolver,
    ) {}

    public function edit(Request $request): Response
    {
        $team = $request->user()->currentTeam;

        $themes = $this->extensions->all()
            ->where('type', 'theme')
            ->where('is_active', true)
            ->values()
            ->map(fn ($ext) => [
                'id' => $ext->id,
                'name' => $ext->name,
                'identifier' => $ext->identifier,
                'description' => $ext->description,
                'version' => $ext->version,
                'author' => $ext->author,
            ]);

        return Inertia::render('settings/theme', [
            'themes' => $themes,
            'activeTheme' => $this->resolver->activeTheme($team->id),
        ]);
    }

    public function update(UpdateTeamThemeRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $this->resolver->setActiveTheme($request->user()->currentTeam->id, $validated['theme']);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Theme updated.')]);

        return back();
    }

    public function deactivate(Request $request): RedirectResponse
    {
        $team = $request->user()->currentTeam;

        $this->resolver->setActiveTheme($team->id, 'none');

        TeamSetting::where('team_id', $team->id)
            ->where('key', 'active_theme')
            ->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Theme reverted to default.')]);

        return back();
    }
}
