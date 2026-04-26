<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewMessage implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $conversationId;

    public int $messageId;

    public string $senderType;

    public int $senderId;

    public string $senderName;

    public string $content;

    public string $type;

    public string $createdAt;

    public function __construct(
        int $conversationId,
        int $messageId,
        string $senderType,
        int $senderId,
        string $senderName,
        string $content,
        string $type,
        string $createdAt,
    ) {
        $this->conversationId = $conversationId;
        $this->messageId = $messageId;
        $this->senderType = $senderType;
        $this->senderId = $senderId;
        $this->senderName = $senderName;
        $this->content = $content;
        $this->type = $type;
        $this->createdAt = $createdAt;
    }

    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('conversation.'.$this->conversationId),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->messageId,
            'conversation_id' => $this->conversationId,
            'sender_type' => $this->senderType,
            'sender_id' => $this->senderId,
            'sender_name' => $this->senderName,
            'content' => $this->content,
            'type' => $this->type,
            'is_mine' => false,
            'encrypted_content' => '',
            'iv' => '',
            'file_name' => null,
            'file_size' => null,
            'encrypted_keys' => [],
            'read_receipts' => [],
            'created_at' => $this->createdAt,
        ];
    }

    public function broadcastAs(): string
    {
        return 'new-message';
    }
}
