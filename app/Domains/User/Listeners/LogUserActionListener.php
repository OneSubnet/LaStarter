<?php

namespace App\Domains\User\Listeners;

use App\Core\Audit\AuditLogger;
use App\Domains\User\Events\UserEvent;

class LogUserActionListener
{
    public function __construct(
        protected AuditLogger $audit,
    ) {}

    public function handle(UserEvent $event): void
    {
        $this->audit->log(
            action: sprintf('user.%s', $event->getAction()),
            subject: $event->getUser(),
            properties: array_merge($event->metadata, [
                'user_id' => $event->getUser()->id,
                'actor_id' => $event->actorId,
            ]),
            module: 'user',
        );
    }
}
