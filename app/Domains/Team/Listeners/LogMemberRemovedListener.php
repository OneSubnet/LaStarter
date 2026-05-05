<?php

namespace App\Domains\Team\Listeners;

use App\Core\Audit\AuditLogger;
use App\Domains\Team\Events\MemberRemovedEvent;

class LogMemberRemovedListener
{
    public function __construct(
        protected AuditLogger $audit,
    ) {}

    public function __invoke(MemberRemovedEvent $event): void
    {
        $this->audit->log(
            action: 'team.member_removed',
            subject: $event->getTeam(),
            properties: [
                'team_id' => $event->teamId,
                'member_id' => $event->userId,
                'role' => $event->role,
                'removed_by' => $event->removedBy,
            ],
            module: 'team',
        );
    }
}
