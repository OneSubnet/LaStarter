<?php

namespace App\Core\Navigation;

use App\Core\Extensions\ExtensionManager;
use App\Models\User;

class NavigationBuilder
{
    public function __construct(
        protected ExtensionManager $extensionManager,
    ) {}

    /**
     * Build navigation items for a sidebar, filtered by permissions and active extensions.
     *
     * @return array<int, array{title: string, href?: string, icon: ?string, order: int, children?: array<int, array{title: string, href: string, icon: ?string, order: int}>}>
     */
    public function build(string $sidebar, int $teamId, User $user): array
    {
        $enabledExtensions = $this->extensionManager->enabled($teamId);
        $teamSlug = $user->currentTeam?->slug ?? (string) $teamId;

        $items = [];

        foreach ($enabledExtensions as $extension) {
            $manifest = $extension->manifest();

            if (! $manifest) {
                continue;
            }

            $navItems = $manifest->navigation[$sidebar] ?? [];

            foreach ($navItems as $navItem) {
                // Handle grouped navigation with children
                if (isset($navItem['children']) && is_array($navItem['children'])) {
                    $children = [];
                    foreach ($navItem['children'] as $child) {
                        // Filter by permission
                        if (isset($child['permission']) && ! $user->hasPermissionTo($child['permission'])) {
                            continue;
                        }

                        // Resolve route to relative URL
                        $href = '#';
                        if (isset($child['route'])) {
                            try {
                                $href = route($child['route'], ['current_team' => $teamSlug], false);
                            } catch (\Exception) {
                                $href = '#';
                            }
                        } elseif (isset($child['url'])) {
                            $href = $child['url'];
                        }

                        $children[] = [
                            'title' => $child['title'] ?? '',
                            'href' => $href,
                            'icon' => $child['icon'] ?? null,
                            'order' => $child['order'] ?? 100,
                            'group' => $child['group'] ?? null,
                        ];
                    }

                    // Only add the group if it has visible children
                    if (count($children) > 0) {
                        usort($children, fn (array $a, array $b) => $a['order'] <=> $b['order']);

                        $items[] = [
                            'title' => $navItem['title'] ?? '',
                            'icon' => $navItem['icon'] ?? null,
                            'order' => $navItem['order'] ?? 100,
                            'children' => $children,
                        ];
                    }

                    continue;
                }

                // Filter by permission
                if (isset($navItem['permission']) && ! $user->hasPermissionTo($navItem['permission'])) {
                    continue;
                }

                // Resolve route to relative URL
                $href = '#';
                if (isset($navItem['route'])) {
                    try {
                        $href = route($navItem['route'], ['current_team' => $teamSlug], false);
                    } catch (\Exception) {
                        $href = '#';
                    }
                } elseif (isset($navItem['url'])) {
                    $href = $navItem['url'];
                }

                $items[] = [
                    'title' => $navItem['title'] ?? '',
                    'href' => $href,
                    'icon' => $navItem['icon'] ?? null,
                    'order' => $navItem['order'] ?? 100,
                ];
            }
        }

        // Sort by order
        usort($items, fn (array $a, array $b) => $a['order'] <=> $b['order']);

        return $items;
    }
}
