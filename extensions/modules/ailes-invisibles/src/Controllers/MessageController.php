<?php

namespace Modules\AilesInvisibles\Controllers;

use App\Events\NewMessage;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Gate;
use Modules\AilesInvisibles\Models\Conversation;
use Modules\AilesInvisibles\Models\Message;
use Modules\AilesInvisibles\Models\MessageEncryptedKey;
use Modules\AilesInvisibles\Services\ConversationAuditService;
use Modules\AilesInvisibles\Services\NextcloudStorageService;

class MessageController
{
    public function store(Request $request): RedirectResponse
    {
        $conversation = Conversation::findOrFail($request->route('conversation'));

        Gate::authorize('send', $conversation);

        $validated = $request->validate([
            'encrypted_content' => ['required', 'string'],
            'iv' => ['required', 'string'],
            'type' => ['sometimes', 'string', 'in:text,file'],
            'file_path' => ['nullable', 'string'],
            'file' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,doc,docx', 'max:20480'],
            'encrypted_keys' => ['required', 'array'],
            'encrypted_keys.*.participant_type' => ['required', 'string'],
            'encrypted_keys.*.participant_id' => ['required', 'integer'],
            'encrypted_keys.*.encrypted_key' => ['required', 'string'],
        ]);

        $messageData = [
            'conversation_id' => $conversation->id,
            'sender_type' => get_class($request->user()),
            'sender_id' => $request->user()->id,
            'encrypted_content' => Crypt::encryptString($validated['encrypted_content']),
            'iv' => $validated['iv'],
            'type' => $validated['type'] ?? 'text',
            'file_path' => $validated['file_path'] ?? null,
        ];

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileContent = file_get_contents($file->getRealPath());
            $fileName = $file->getClientOriginalName();

            $nextcloud = app(NextcloudStorageService::class);
            $teamSlug = $request->user()->currentTeam?->slug ?? 'default';

            if ($nextcloud->isConfigured()) {
                $remotePath = $nextcloud->upload(
                    "attachments/{$conversation->id}/".uniqid().'_'.$fileName,
                    $fileContent,
                    $teamSlug
                );
                $messageData['file_path'] = 'nextcloud:'.$remotePath;
            } else {
                $path = $file->store('ai/attachments', 'local');
                $messageData['file_path'] = $path;
            }

            $messageData['file_name'] = $fileName;
            $messageData['file_size'] = $file->getSize();
            $messageData['type'] = 'file';
        }

        $message = Message::create($messageData);

        foreach ($validated['encrypted_keys'] as $keyData) {
            MessageEncryptedKey::create([
                'message_id' => $message->id,
                'participant_type' => $keyData['participant_type'],
                'participant_id' => $keyData['participant_id'],
                'encrypted_key' => $keyData['encrypted_key'],
            ]);
        }

        // Update conversation's last_message_at
        $conversation->update(['last_message_at' => now()]);

        // Broadcast to other participants via WebSocket
        broadcast(new NewMessage(
            $conversation->id,
            $message->id,
            $message->sender_type,
            $message->sender_id,
            $request->user()->name,
            $validated['encrypted_content'],
            $message->type,
            $message->created_at->toISOString(),
        ));

        app(ConversationAuditService::class)->log(
            $conversation,
            $message->type === 'file' ? 'file_attached' : 'message_sent',
            $request->user(),
            ['message_id' => $message->id]
        );

        // Notify other admin participants
        $otherAdmins = $conversation->participants()
            ->where('participant_type', User::class)
            ->where('participant_id', '!=', $request->user()->id)
            ->get();

        foreach ($otherAdmins as $participant) {
            Notification::create([
                'team_id' => $conversation->team_id,
                'user_id' => $participant->participant_id,
                'type' => 'message',
                'title' => __('New message'),
                'body' => __(':name sent a message in a conversation', ['name' => $request->user()->name]),
                'data' => ['url' => url("/{$conversation->team_id}/ai/conversations/inbox?conversation={$conversation->id}")],
            ]);
        }

        return back()->with('toast', ['type' => 'success', 'message' => __('Message sent.')]);
    }
}
