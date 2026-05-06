<?php

namespace App\Core\Navigation;

use App\Core\Extensions\ExtensionManager;
use App\Core\Hooks\Hook;
use Illuminate\Support\Collection;

final class NavigationBuilder
{
    public function __construct(
        private readonly ExtensionManager $extensions,
    ) {}

    /**
     * Build sidebar navigation for a team.
     *
     * @return list<array{group: string, items: list<array{label: string, href: string, icon: ?string, permission: ?string}>>}
     */
    public function build(string $sidebar, int $teamId, $user): array
    {
        $groups = new Collection;

        // Core navigation
        $coreItems = $this->coreItems($user);

        if ($coreItems->isNotEmpty()) {
            $groups->push(['group' => 'Platform', 'items' => $coreItems->all()]);
        }

        // Extension navigation
        $enabledIds = $this->extensions->enabledIdentifiers($teamId);

        foreach ($enabledIds as $identifier) {
            $manifest = $this->extensions->manifest($identifier);

            if ($manifest === null) {
                continue;
            }

            $items = $this->extensionItems($manifest, $user);

            if ($items->isNotEmpty()) {
                $groups->push(['group' => $manifest->name, 'items' => $items->all()]);
            }
        }

        // Settings at the bottom
        $settingsItems = $this->settingsItems($user);

        if ($settingsItems->isNotEmpty()) {
            $groups->push(['group' => 'Settings', 'items' => $settingsItems->all()]);
        }

        Hook::dispatch(Hook::SIDEBAR_BUILD, $groups);

        return $groups->all();
    }

    private function coreItems($user): Collection
    {
        $items = new Collection;

        $items->push([
            'label' => 'Dashboard',
            'href' => '/dashboard',
            'icon' => 'LayoutDashboard',
            'permission' => null,
        ]);

        return $items;
    }

    private function extensionItems($manifest, $user): Collection
    {
        $items = new Collection;

        foreach ($manifest->navigation as $navItem) {
            $permission = $navItem['permission'] ?? null;

            if ($permission && $user && ! $user->hasPermissionTo($permission)) {
                continue;
            }

            $items->push([
                'label' => $navItem['label'] ?? '',
                'href' => $navItem['href'] ?? '#',
                'icon' => $navItem['icon'] ?? null,
                'permission' => $permission,
            ]);
        }

        return $items;
    }

    private function settingsItems($user): Collection
    {
        $items = new Collection;

        $items->push([
            'label' => 'Settings',
            'href' => '/settings/general',
            'icon' => 'Settings',
            'permission' => 'team.update',
        ]);

        return $items;
    }
}
