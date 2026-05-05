<?php

namespace App\Listeners;

use App\Core\Hooks\Events\ModuleBootEvent;

class SetupModuleContext
{
    public function handle(ModuleBootEvent $event): void
    {
        // Module-specific context setup
        // This is called during module boot phase
    }
}
