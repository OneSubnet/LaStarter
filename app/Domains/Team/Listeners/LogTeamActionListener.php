<?php

namespace App\Domains\Team\Listeners;

use App\Core\Audit\AuditLogger;
use App\Domains\Team\Events\TeamEvent;

class LogTeamActionListener
{
    public function __construct(
        protected AuditLogger $audit,
    ) {}

    public function handle(TeamEvent $event): void
    {
        $this->audit->log(
            action: sprintf('team.%s', $event->getAction()),
            subject: $event->getTeam(),
            properties: array_merge($event->metadata, [
                'team_id' => $event->teamId,
                'team_name' => $event->getTeam()->name,
            ]),
            module: 'team',
        );
    }
}
