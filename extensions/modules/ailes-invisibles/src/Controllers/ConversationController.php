<?php

namespace Modules\AilesInvisibles\Controllers;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Modules\AilesInvisibles\Models\Client;
use Modules\AilesInvisibles\Models\ClientUser;
use Modules\AilesInvisibles\Models\Conversation;
use Modules\AilesInvisibles\Models\ConversationParticipant;
use Modules\AilesInvisibles\Models\Message;
use Modules\AilesInvisibles\Models\MessageReadReceipt;
use Modules\AilesInvisibles\Services\ConversationAuditService;
use Modules\AilesInvisibles\Services\NextcloudStorageService;

class ConversationController
{
    private const ALLOWED_PARTICIPANT_TYPES = [
        User::class,
        ClientUser::class,
    ];

    public function inbox(Request $request): Response
    {
        Gate::authorize('viewAny', Conversation::class);

        $user = $request->user();
        $selectedId = $request->query('conversation');

        // Count queries
        $counts = [
            'active' => Conversation::notArchived()->count(),
            'archived' => Conversation::archived()->count(),
            'unassigned' => Conversation::unassigned()->notArchived()->count(),
        ];

        // All conversations with last message and participant names
        $allConversations = Conversation::query()
            ->with(['participants', 'messages' => fn ($q) => $q->latest()->limit(1)])
            ->orderBy('last_message_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        // Bulk-load participant names to avoid N+1
        $userIds = $allConversations->pluck('participants')->flatten(1)->where('participant_type', User::class)->pluck('participant_id')->unique()->values()->toArray();
        $clientUserIds = $allConversations->pluck('participants')->flatten(1)->where('participant_type', ClientUser::class)->pluck('participant_id')->unique()->values()->toArray();
        $usersMap = User::whereIn('id', $userIds)->pluck('name', 'id');
        $clientUsersMap = ClientUser::with('client')->whereIn('id', $clientUserIds)->get()->mapWithKeys(fn ($cu) => [$cu->id => $cu->client]);

        $conversations = $allConversations->map(function (Conversation $c) use ($user) {
            // Count unread messages: messages not sent by current user that have no read receipt from current user
            $unreadCount = $c->messages()
                ->where(function ($q) use ($user) {
                    $q->where('sender_type', '!=', get_class($user))
                        ->orWhere(fn ($q) => $q->where('sender_type', get_class($user))
                            ->where('sender_id', '!=', $user->id));
                })
                ->whereDoesntHave('readReceipts', function ($q) use ($user) {
                    $q->where('reader_type', get_class($user))
                        ->where('reader_id', $user->id);
                })
                ->count();

            return [
                'id' => $c->id,
                'title' => $c->title,
                'type' => $c->type,
                'archived_at' => $c->archived_at?->toISOString(),
                'last_message_at' => $c->last_message_at?->toISOString(),
                'created_at' => $c->created_at->toISOString(),
                'unread_count' => $unreadCount,
                'last_message' => $c->messages->first() ? [
                    'sender_type' => $c->messages->first()->sender_type,
                    'type' => $c->messages->first()->type,
                    'created_at' => $c->messages->first()->created_at->toISOString(),
                ] : null,
                'participants' => $c->participants->map(fn ($p) => [
                    'id' => $p->id,
                    'participant_type' => $p->participant_type,
                    'participant_id' => $p->participant_id,
                    'role' => $p->role,
                    'name' => $p->participant_type === User::class
                        ? $usersMap[$p->participant_id] ?? 'Unknown'
                        : $clientUsersMap[$p->participant_id]?->full_name ?? 'Unknown',
                    'company_name' => $p->participant_type === ClientUser::class
                        ? $clientUsersMap[$p->participant_id]?->company_name
                        : null,
                ]),
            ];
        });

        // Selected conversation detail
        $selectedConversation = null;
        if ($selectedId) {
            $conv = Conversation::with(['participants', 'messages.encryptedKeys', 'messages.readReceipts', 'auditLogs'])
                ->find($selectedId);
            if ($conv && Gate::allows('view', $conv)) {
                $selectedConversation = $this->formatConversationDetail($conv, $user);

                // Mark messages as read and clear related notifications
                $this->markConversationRead($conv, $user);
            }
        }

        $clients = Client::with('portalUser')->orderBy('last_name')->get()->map(fn (Client $client) => [
            'id' => $client->id,
            'name' => trim("{$client->first_name} {$client->last_name}"),
            'company_name' => $client->company_name,
            'portal_user' => $client->portalUser ? [
                'id' => $client->portalUser->id,
                'email' => $client->portalUser->email,
            ] : null,
        ]);

        return Inertia::render('ailes-invisibles/admin/conversations/Inbox', [
            'conversations' => $conversations,
            'selected_conversation' => $selectedConversation,
            'clients' => $clients,
            'counts' => $counts,
        ]);
    }

    private function formatConversationDetail(Conversation $conversation, $user): array
    {
        // Bulk-load all participant and sender names
        $participantUserIds = $conversation->participants->where('participant_type', User::class)->pluck('participant_id')->unique()->values()->toArray();
        $participantClientUserIds = $conversation->participants->where('participant_type', ClientUser::class)->pluck('participant_id')->unique()->values()->toArray();
        $senderUserIds = $conversation->messages->where('sender_type', User::class)->pluck('sender_id')->unique()->values()->toArray();
        $senderClientUserIds = $conversation->messages->where('sender_type', ClientUser::class)->pluck('sender_id')->unique()->values()->toArray();
        $actorUserIds = $conversation->auditLogs->where('actor_type', User::class)->pluck('actor_id')->unique()->values()->toArray();
        $actorClientUserIds = $conversation->auditLogs->where('actor_type', ClientUser::class)->pluck('actor_id')->unique()->values()->toArray();

        $allUserIds = array_values(array_unique(array_merge($participantUserIds, $senderUserIds, $actorUserIds)));
        $allClientUserIds = array_values(array_unique(array_merge($participantClientUserIds, $senderClientUserIds, $actorClientUserIds)));

        $usersMap = User::whereIn('id', $allUserIds)->pluck('name', 'id');
        $clientUsersMap = ClientUser::with('client')->whereIn('id', $allClientUserIds)->get()->mapWithKeys(fn ($cu) => [$cu->id => $cu->client]);

        return [
            'id' => $conversation->id,
            'title' => $conversation->title,
            'type' => $conversation->type,
            'archived_at' => $conversation->archived_at?->toISOString(),
            'last_message_at' => $conversation->last_message_at?->toISOString(),
            'participants' => $conversation->participants->map(fn ($p) => [
                'id' => $p->id,
                'participant_type' => $p->participant_type,
                'participant_id' => $p->participant_id,
                'role' => $p->role,
                'joined_at' => $p->joined_at?->toISOString(),
                'name' => $p->participant_type === User::class
                    ? $usersMap[$p->participant_id] ?? 'Unknown'
                    : $clientUsersMap[$p->participant_id]?->full_name ?? 'Unknown',
                'company_name' => $p->participant_type === ClientUser::class
                    ? $clientUsersMap[$p->participant_id]?->company_name
                    : null,
            ]),
            'messages' => $conversation->messages->map(fn ($message) => [
                'id' => $message->id,
                'sender_type' => $message->sender_type,
                'sender_id' => $message->sender_id,
                'sender_name' => $message->sender_type === User::class
                    ? $usersMap[$message->sender_id] ?? 'Unknown'
                    : $clientUsersMap[$message->sender_id]?->full_name ?? 'Unknown',
                'encrypted_content' => $message->encrypted_content,
                'content' => $this->decryptContent($message->encrypted_content),
                'iv' => $message->iv,
                'type' => $message->type,
                'file_name' => $message->file_name,
                'file_size' => $message->file_size,
                'is_mine' => $message->sender_type === get_class($user) && $message->sender_id === $user->id,
                'encrypted_keys' => $message->encryptedKeys->map(fn ($key) => [
                    'participant_type' => $key->participant_type,
                    'participant_id' => $key->participant_id,
                    'encrypted_key' => $key->encrypted_key,
                ]),
                'read_receipts' => $message->readReceipts->map(fn ($r) => [
                    'reader_type' => $r->reader_type,
                    'reader_id' => $r->reader_id,
                    'read_at' => $r->read_at->toISOString(),
                ]),
                'created_at' => $message->created_at->toISOString(),
            ]),
            'audit_logs' => $conversation->auditLogs->map(fn ($log) => [
                'id' => $log->id,
                'event' => $log->event,
                'actor_name' => $log->actor_type
                    ? ($log->actor_type === User::class
                        ? $usersMap[$log->actor_id] ?? null
                        : $clientUsersMap[$log->actor_id]?->full_name)
                    : null,
                'metadata' => $log->metadata,
                'created_at' => $log->created_at->toISOString(),
            ]),
        ];
    }

    public function markAsRead(Request $request): RedirectResponse
    {
        $conversation = Conversation::findOrFail($request->route('conversation'));
        Gate::authorize('view', $conversation);

        $user = $request->user();
        $messageIds = $conversation->messages()
            ->where(function ($q) use ($user) {
                $q->where('sender_type', '!=', get_class($user))
                    ->orWhere(fn ($q) => $q->where('sender_type', get_class($user))
                        ->where('sender_id', '!=', $user->id));
            })
            ->pluck('id');

        foreach ($messageIds as $messageId) {
            MessageReadReceipt::firstOrCreate([
                'message_id' => $messageId,
                'reader_type' => get_class($user),
                'reader_id' => $user->id,
            ], ['read_at' => now()]);
        }

        return back();
    }

    public function downloadAttachment(Request $request)
    {
        $conversation = Conversation::findOrFail($request->route('conversation'));
        Gate::authorize('view', $conversation);

        $message = $conversation->messages()->findOrFail($request->route('message'));

        if (! $message->file_path) {
            abort(404);
        }

        if (str_starts_with($message->file_path, 'nextcloud:')) {
            $remotePath = substr($message->file_path, strlen('nextcloud:'));
            $nextcloud = app(NextcloudStorageService::class);
            $tempPath = $nextcloud->downloadToTemp($remotePath);

            return response()->download($tempPath, $message->file_name ?? 'attachment')->deleteFileAfterSend();
        }

        return response()->download(
            storage_path('app/'.$message->file_path),
            $message->file_name ?? 'attachment'
        );
    }

    public function addParticipant(Request $request): RedirectResponse
    {
        $conversation = Conversation::findOrFail($request->route('conversation'));
        Gate::authorize('update', $conversation);

        $validated = $request->validate([
            'participant_type' => ['required', 'string', Rule::in(self::ALLOWED_PARTICIPANT_TYPES)],
            'participant_id' => ['required', 'integer'],
        ]);

        ConversationParticipant::firstOrCreate([
            'conversation_id' => $conversation->id,
            'participant_type' => $validated['participant_type'],
            'participant_id' => $validated['participant_id'],
        ], [
            'role' => 'member',
            'joined_at' => now(),
        ]);

        app(ConversationAuditService::class)->log(
            $conversation, 'participant_joined', $request->user(),
            ['participant_type' => $validated['participant_type'], 'participant_id' => $validated['participant_id']]
        );

        return back()->with('toast', ['type' => 'success', 'message' => __('Participant added.')]);
    }

    public function removeParticipant(Request $request): RedirectResponse
    {
        $conversation = Conversation::findOrFail($request->route('conversation'));
        Gate::authorize('update', $conversation);

        $participant = ConversationParticipant::findOrFail($request->route('participant'));

        app(ConversationAuditService::class)->log(
            $conversation, 'participant_left', $request->user(),
            ['participant_type' => $participant->participant_type, 'participant_id' => $participant->participant_id]
        );

        $participant->delete();

        return back()->with('toast', ['type' => 'success', 'message' => __('Participant removed.')]);
    }

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Conversation::class);

        $isArchived = $request->boolean('archived');

        $conversations = Conversation::query()
            ->when($isArchived, fn ($q) => $q->archived(), fn ($q) => $q->notArchived())
            ->with(['participants', 'messages' => fn ($q) => $q->latest()->limit(1)])
            ->orderBy('last_message_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (Conversation $conversation) => [
                'id' => $conversation->id,
                'title' => $conversation->title,
                'type' => $conversation->type,
                'archived_at' => $conversation->archived_at?->toISOString(),
                'last_message_at' => $conversation->last_message_at?->toISOString(),
                'participants' => $conversation->participants->map(fn ($p) => [
                    'id' => $p->id,
                    'participant_type' => $p->participant_type,
                    'participant_id' => $p->participant_id,
                    'role' => $p->role,
                ]),
                'last_message' => $conversation->messages->first() ? [
                    'id' => $conversation->messages->first()->id,
                    'sender_type' => $conversation->messages->first()->sender_type,
                    'type' => $conversation->messages->first()->type,
                    'created_at' => $conversation->messages->first()->created_at->toISOString(),
                ] : null,
                'created_at' => $conversation->created_at->toISOString(),
            ]);

        $clients = Client::with('portalUser')->orderBy('last_name')->get()->map(fn (Client $client) => [
            'id' => $client->id,
            'name' => trim("{$client->first_name} {$client->last_name}"),
            'company_name' => $client->company_name,
            'portal_user' => $client->portalUser ? [
                'id' => $client->portalUser->id,
                'email' => $client->portalUser->email,
            ] : null,
        ]);

        return Inertia::render('ailes-invisibles/admin/conversations/Index', [
            'conversations' => $conversations,
            'clients' => $clients,
            'isArchived' => $isArchived,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('viewAny', Conversation::class);

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:direct,group'],
            'message' => ['nullable', 'string'],
            'participants' => ['required', 'array', 'min:1'],
            'participants.*.participant_type' => ['required', 'string', Rule::in(self::ALLOWED_PARTICIPANT_TYPES)],
            'participants.*.participant_id' => ['required', 'integer'],
        ]);

        $conversation = Conversation::create([
            'title' => $validated['title'] ?? null,
            'type' => $validated['type'],
            'created_by_type' => get_class($request->user()),
            'created_by_id' => $request->user()->id,
        ]);

        // Add the current user as a participant
        ConversationParticipant::firstOrCreate([
            'conversation_id' => $conversation->id,
            'participant_type' => get_class($request->user()),
            'participant_id' => $request->user()->id,
        ], [
            'role' => 'owner',
            'joined_at' => now(),
        ]);

        // Add other participants (skip if same as creator)
        foreach ($validated['participants'] as $participant) {
            if ($participant['participant_type'] === get_class($request->user()) && $participant['participant_id'] === $request->user()->id) {
                continue;
            }
            ConversationParticipant::firstOrCreate([
                'conversation_id' => $conversation->id,
                'participant_type' => $participant['participant_type'],
                'participant_id' => $participant['participant_id'],
            ], [
                'role' => 'member',
                'joined_at' => now(),
            ]);
        }

        // Create initial message if provided
        if (! empty($validated['message'])) {
            Message::create([
                'conversation_id' => $conversation->id,
                'sender_type' => get_class($request->user()),
                'sender_id' => $request->user()->id,
                'encrypted_content' => Crypt::encryptString($validated['message']),
                'type' => 'text',
            ]);
            $conversation->update(['last_message_at' => now()]);
        }

        app(ConversationAuditService::class)->log($conversation, 'created', $request->user());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Conversation created.')]);

        return to_route('ai.conversations.show', [
            'current_team' => $request->user()->currentTeam->slug,
            'conversation' => $conversation->id,
        ]);
    }

    public function show(Request $request): Response
    {
        $conversation = Conversation::with(['participants', 'messages', 'messages.encryptedKeys'])
            ->findOrFail($request->route('conversation'));

        Gate::authorize('view', $conversation);

        return Inertia::render('ailes-invisibles/admin/conversations/Show', [
            'conversation' => [
                'id' => $conversation->id,
                'title' => $conversation->title,
                'type' => $conversation->type,
                'last_message_at' => $conversation->last_message_at?->toISOString(),
                'participants' => $conversation->participants->map(fn ($p) => [
                    'id' => $p->id,
                    'participant_type' => $p->participant_type,
                    'participant_id' => $p->participant_id,
                    'role' => $p->role,
                    'joined_at' => $p->joined_at?->toISOString(),
                ]),
                'messages' => $conversation->messages->map(fn ($message) => [
                    'id' => $message->id,
                    'sender_type' => $message->sender_type,
                    'sender_id' => $message->sender_id,
                    'encrypted_content' => $message->encrypted_content,
                    'iv' => $message->iv,
                    'type' => $message->type,
                    'encrypted_keys' => $message->encryptedKeys->map(fn ($key) => [
                        'id' => $key->id,
                        'participant_type' => $key->participant_type,
                        'participant_id' => $key->participant_id,
                        'encrypted_key' => $key->encrypted_key,
                    ]),
                    'created_at' => $message->created_at->toISOString(),
                ]),
                'created_at' => $conversation->created_at->toISOString(),
                'updated_at' => $conversation->updated_at->toISOString(),
            ],
        ]);
    }

    public function updateTitle(Request $request): RedirectResponse
    {
        $conversation = Conversation::findOrFail($request->route('conversation'));
        Gate::authorize('update', $conversation);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
        ]);

        $conversation->update(['title' => $validated['title']]);

        app(ConversationAuditService::class)->log($conversation, 'renamed', $request->user(), ['title' => $validated['title']]);

        return back()->with('toast', ['type' => 'success', 'message' => __('Conversation renamed.')]);
    }

    public function archive(Request $request): RedirectResponse
    {
        $conversation = Conversation::findOrFail($request->route('conversation'));

        Gate::authorize('update', $conversation);

        $conversation->update(['archived_at' => now()]);

        app(ConversationAuditService::class)->log($conversation, 'archived', $request->user());

        return back()->with('toast', ['type' => 'success', 'message' => __('Conversation archived.')]);
    }

    public function unarchive(Request $request): RedirectResponse
    {
        $conversation = Conversation::findOrFail($request->route('conversation'));

        Gate::authorize('update', $conversation);

        $conversation->update(['archived_at' => null]);

        app(ConversationAuditService::class)->log($conversation, 'unarchived', $request->user());

        return back()->with('toast', ['type' => 'success', 'message' => __('Conversation unarchived.')]);
    }

    private function decryptContent(string $encrypted): string
    {
        try {
            return Crypt::decryptString($encrypted);
        } catch (\Throwable) {
            // Fallback: might be legacy base64-encoded content
            try {
                return base64_decode($encrypted);
            } catch (\Throwable) {
                return $encrypted;
            }
        }
    }

    private function markConversationRead(Conversation $conversation, $user): void
    {
        $messageIds = $conversation->messages()
            ->where(function ($q) use ($user) {
                $q->where('sender_type', '!=', get_class($user))
                    ->orWhere(fn ($q) => $q->where('sender_type', get_class($user))
                        ->where('sender_id', '!=', $user->id));
            })
            ->pluck('id');

        foreach ($messageIds as $messageId) {
            MessageReadReceipt::firstOrCreate([
                'message_id' => $messageId,
                'reader_type' => get_class($user),
                'reader_id' => $user->id,
            ], ['read_at' => now()]);
        }

        // Clear notifications related to this conversation for this user
        Notification::where('user_id', $user->id)
            ->where('type', 'message')
            ->whereNull('read_at')
            ->where('data->url', 'like', "%conversation={$conversation->id}%")
            ->update(['read_at' => now()]);
    }
}
