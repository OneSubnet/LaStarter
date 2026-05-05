<?php

namespace App\Listeners;

use App\Core\Audit\AuditLogger;
use App\Core\Hooks\Events\ExtensionStateChangedEvent;

class ProcessExtensionStateChange
{
    public function __construct(
        protected AuditLogger $audit,
    ) {}

    public function handle(ExtensionStateChangedEvent $event): void
    {
        $this->audit->log(
            action: sprintf('extension.%s', $event->action),
            properties: [
                'extension_id' => $event->extensionId,
                'team_id' => $event->teamId,
                'previous_state' => $event->previousState,
                'new_state' => $event->newState,
            ],
            module: 'extensions',
        );
    }
}
