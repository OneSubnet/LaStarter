<?php

namespace App\Core\Navigation\Events;

final class SidebarBuilding
{
    /**
     * @param  list<array{title: string, icon: ?string, order: int, href: string, permission?: ?string, children?: list<array{title: string, icon: ?string, order: int, group: ?string, href: string}>}>  $items
     */
    public function __construct(
        public array $items,
    ) {}
}
