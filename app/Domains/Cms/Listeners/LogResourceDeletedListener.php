<?php

namespace App\Domains\Cms\Listeners;

use App\Domains\Cms\Event\ResourceDeletedEvent;

class LogResourceDeletedListener extends LogResourceActionListener
{
    public function __invoke(ResourceDeletedEvent $event): void
    {
        $this->handle($event);
    }
}
