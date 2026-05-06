<?php

namespace App\Core\Navigation;

use App\Core\Extensions\ExtensionManager;
use App\Core\Hooks\Hook;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\Route;

final class NavigationBuilder
{
    public function __construct(
        private readonly ExtensionManager $extensions,
    ) {}

    /**
     * Build sidebar navigation for a team.
     *
     * @return list<array{title: string, icon: ?string, order: int, href: string, permission?: ?string, children?: list<array{title: string, icon: ?string, order: int, group: ?string, href: string}>}>
     */
    public function build(Team $team, User $user): array
    {
        $navItems = [];

        foreach ($this->extensions->enabledIdentifiers($team->id) as $identifier) {
            $manifest = $this->extensions->manifest($identifier);

            if ($manifest === null) {
                continue;
            }

            $rawNav = $manifest->navigation['app'] ?? [];

            foreach ($rawNav as $item) {
                $resolved = $this->resolveItem($item, $team, $user);

                if ($resolved !== null) {
                    $navItems[] = $resolved;
                }
            }
        }

        Hook::dispatch(Hook::SIDEBAR_BUILD, $navItems);

        return $navItems;
    }

    /**
     * Resolve a single navigation item, handling route resolution and permissions.
     */
    private function resolveItem(array $item, Team $team, User $user): ?array
    {
        $permission = $item['permission'] ?? null;

        if ($permission && ! $user->hasPermissionTo($permission)) {
            return null;
        }

        $resolved = [
            'title' => $item['title'] ?? '',
            'icon' => $item['icon'] ?? null,
            'order' => $item['order'] ?? 0,
        ];

        $resolved['href'] = $this->resolveHref($item, $team);

        if (isset($item['children']) && is_array($item['children'])) {
            $children = [];

            foreach ($item['children'] as $child) {
                $childPerm = $child['permission'] ?? null;

                if ($childPerm && ! $user->hasPermissionTo($childPerm)) {
                    continue;
                }

                $children[] = [
                    'title' => $child['title'] ?? '',
                    'icon' => $child['icon'] ?? null,
                    'order' => $child['order'] ?? 0,
                    'group' => $child['group'] ?? null,
                    'href' => $this->resolveHref($child, $team),
                ];
            }

            $resolved['children'] = $children;
        }

        return $resolved;
    }

    /**
     * Resolve the href for a navigation item.
     * Supports both `route` (Laravel route name) and `href` (direct URL).
     */
    private function resolveHref(array $item, Team $team): string
    {
        if (isset($item['route'])) {
            try {
                return route($item['route'], ['current_team' => $team->slug], false);
            } catch (\Throwable) {
                return $item['href'] ?? '#';
            }
        }

        return $item['href'] ?? '#';
    }
}
