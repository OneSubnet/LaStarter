<?php

namespace App\Core\Themes;

use App\Models\Team;
use App\Models\TeamSetting;

class ComponentResolver
{
    /**
     * Get the active theme identifier for a team.
     */
    public function activeTheme(int $teamId): ?string
    {
        $setting = TeamSetting::where('team_id', $teamId)
            ->where('key', 'active_theme')
            ->first();

        return $setting?->value;
    }

    /**
     * Set the active theme for a team.
     */
    public function setActiveTheme(int $teamId, string $themeIdentifier): void
    {
        TeamSetting::updateOrCreate(
            ['team_id' => $teamId, 'key' => 'active_theme'],
            ['value' => $themeIdentifier],
        );
    }

    /**
     * Resolve the component path for a given page name.
     *
     * This is used by the backend to determine the Inertia page name,
     * which the frontend then resolves to the actual React component.
     *
     * Resolution order:
     * 1. Theme override (themes/{theme}/overrides/{page})
     * 2. Module page (modules/{module}/pages/{page})
     * 3. Core page (fallback)
     */
    public function resolve(int $teamId, string $page): string
    {
        $theme = $this->activeTheme($teamId);

        if ($theme) {
            $overridePath = base_path("extensions/themes/{$theme}/resources/js/overrides/{$page}.tsx");

            if (file_exists($overridePath)) {
                return "theme:{$theme}/{$page}";
            }
        }

        // Return the page name as-is — the frontend resolver will handle module pages
        return $page;
    }
}
