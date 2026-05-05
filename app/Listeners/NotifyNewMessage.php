<?php

namespace App\Listeners;

use App\Core\Audit\AuditLogger;
use App\Events\NewMessage;
use Illuminate\Support\Facades\Broadcast;

class NotifyNewMessage
{
    public function __construct(
        protected AuditLogger $audit,
    ) {}

    public function handle(NewMessage $event): void
    {
        $this->audit->log(
            action: 'message.sent',
            subject: $event->message,
            properties: [
                'conversation_id' => $event->message->conversation_id,
                'sender_id' => $event->message->sender_id,
            ],
            module: 'messaging',
        );

        // Broadcast to conversation channel
        Broadcast::channel('conversation.'.$event->message->conversation_id);
    }
}
