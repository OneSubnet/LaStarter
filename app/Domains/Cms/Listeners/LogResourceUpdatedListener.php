<?php

namespace App\Domains\Cms\Listeners;

use App\Domains\Cms\Event\ResourceUpdatedEvent;

class LogResourceUpdatedListener extends LogResourceActionListener
{
    public function __invoke(ResourceUpdatedEvent $event): void
    {
        $this->handle($event);
    }
}
