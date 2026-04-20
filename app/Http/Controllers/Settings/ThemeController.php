<?php

namespace App\Http\Controllers\Settings;

use App\Core\Extensions\ExtensionManager;
use App\Core\Themes\ComponentResolver;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateTeamThemeRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ThemeController extends Controller
{
    /**
     * Display the theme selection page.
     */
    public function edit(Request $request): Response
    {
        $team = $request->user()->currentTeam;
        $resolver = app(ComponentResolver::class);
        $manager = app(ExtensionManager::class);

        $themes = $manager->all()
            ->where('type', 'theme')
            ->where('is_active', true)
            ->values()
            ->map(fn ($ext) => [
                'id' => $ext->id,
                'name' => $ext->name,
                'identifier' => $ext->identifier,
                'description' => $ext->description,
            ]);

        return Inertia::render('settings/theme', [
            'themes' => $themes,
            'activeTheme' => $resolver->activeTheme($team->id),
        ]);
    }

    /**
     * Update the active theme for the current team.
     */
    public function update(UpdateTeamThemeRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $resolver = app(ComponentResolver::class);
        $resolver->setActiveTheme($request->user()->currentTeam->id, $validated['theme']);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Theme updated.')]);

        return back();
    }
}
