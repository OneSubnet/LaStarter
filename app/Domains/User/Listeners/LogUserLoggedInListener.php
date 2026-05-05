<?php

namespace App\Domains\User\Listeners;

use App\Core\Audit\AuditLogger;
use App\Domains\User\Events\UserLoggedInEvent;

class LogUserLoggedInListener
{
    public function __construct(
        protected AuditLogger $audit,
    ) {}

    public function __invoke(UserLoggedInEvent $event): void
    {
        $this->audit->log(
            action: 'user.logged_in',
            subject: $event->getUser(),
            properties: [
                'user_id' => $event->getUser()->id,
                'ip_address' => $event->ipAddress,
                'user_agent' => $event->userAgent,
            ],
            module: 'user',
        );
    }
}
