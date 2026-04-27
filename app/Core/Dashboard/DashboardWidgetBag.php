<?php

namespace App\Core\Dashboard;

class DashboardWidgetBag
{
    /** @var array<int, array{id: string, title: string, description: string, icon: string, type: string, value: mixed, group: string, order: int}> */
    private array $widgets = [];

    public function add(string $id, string $title, string $description, string $icon, string $type, mixed $value, string $group = '', int $order = 0): self
    {
        $this->widgets[] = [
            'id' => $id,
            'title' => $title,
            'description' => $description,
            'icon' => $icon,
            'type' => $type,
            'value' => $value,
            'group' => $group,
            'order' => $order,
        ];

        return $this;
    }

    /**
     * @return array<int, array{id: string, title: string, description: string, icon: string, type: string, value: mixed, group: string, order: int}>
     */
    public function all(): array
    {
        return collect($this->widgets)->sortBy('order')->values()->all();
    }
}
