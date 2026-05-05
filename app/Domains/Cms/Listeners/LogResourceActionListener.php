<?php

namespace App\Domains\Cms\Listeners;

use App\Core\Audit\AuditLogger;
use App\Domains\Cms\Event\ResourceEvent;

class LogResourceActionListener
{
    public function __construct(
        protected AuditLogger $audit,
    ) {}

    public function handle(ResourceEvent $event): void
    {
        $this->audit->log(
            action: $event->getDescription(),
            subject: $event->model,
            properties: $event->metadata,
            module: $this->extractModule($event),
        );
    }

    protected function extractModule(ResourceEvent $event): ?string
    {
        $class = get_class($event->model);

        return match (true) {
            str_starts_with($class, 'Modules\\') => 'ailes-invisibles',
            str_starts_with($class, 'App\\Domains\\') => match (true) {
                str_contains($class, '\\Team\\') => 'team',
                str_contains($class, '\\User\\') => 'user',
                str_contains($class, '\\Invoice\\') => 'invoice',
                default => null,
            },
            default => null,
        };
    }
}
