<?php

namespace App\Core\Widgets;

use App\Core\Extensions\ExtensionManager;
use App\Models\User;

final class WidgetRegistry
{
    /** @var array<string, WidgetDefinition> */
    private array $widgets = [];

    public function register(WidgetDefinition $widget): void
    {
        $this->widgets[$widget->identifier] = $widget;
    }

    /**
     * @return list<WidgetDefinition>
     */
    public function all(): array
    {
        return array_values($this->widgets);
    }

    /**
     * Return widgets available to a user on a given team.
     *
     * @return list<array{identifier: string, label: string, type: string, size: array{w: int, h: int}, permission: ?string}>
     */
    public function forTeam(int $teamId, User $user): array
    {
        $enabled = app(ExtensionManager::class)->enabledIdentifiers($teamId);

        return array_values(array_filter($this->widgets, function (WidgetDefinition $w) use ($enabled, $user) {
            if ($w->module !== 'core' && ! in_array($w->module, $enabled, true)) {
                return false;
            }

            if ($w->permission && ! $user->hasPermissionTo($w->permission)) {
                return false;
            }

            return true;
        }));
    }
}
