<?php

namespace App\Domains\Cms\Listeners;

use App\Domains\Cms\Event\ResourceCreatedEvent;

class LogResourceCreatedListener extends LogResourceActionListener
{
    public function __invoke(ResourceCreatedEvent $event): void
    {
        $this->handle($event);
    }
}
