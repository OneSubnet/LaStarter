<?php

namespace Modules\AilesInvisibles\Controllers;

use App\Concerns\TeamScope;
use App\Events\NewMessage;
use App\Models\Notification;
use App\Models\Team;
use App\Models\TeamSetting;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Modules\AilesInvisibles\Models\ClientUser;
use Modules\AilesInvisibles\Models\Conversation;
use Modules\AilesInvisibles\Models\ConversationParticipant;
use Modules\AilesInvisibles\Models\DocumentSignature;
use Modules\AilesInvisibles\Models\Invoice;
use Modules\AilesInvisibles\Models\Message;
use Modules\AilesInvisibles\Models\MessageEncryptedKey;
use Modules\AilesInvisibles\Models\MessageReadReceipt;
use Modules\AilesInvisibles\Models\PortalDocument;
use Modules\AilesInvisibles\Models\Quote;
use Modules\AilesInvisibles\Services\ConversationAuditService;
use Modules\AilesInvisibles\Services\NextcloudStorageService;

class ClientPortalController
{
    public function showLogin(): InertiaResponse
    {
        return Inertia::render('ailes-invisibles/portal/Login');
    }

    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::guard('client')->attempt($credentials)) {
            return back()->withErrors([
                'email' => __('Invalid credentials.'),
            ]);
        }

        $clientUser = Auth::guard('client')->user();
        $clientUser->update(['last_login_at' => now()]);

        $request->session()->forget('url.intended');

        $team = Team::withoutGlobalScope(TeamScope::class)->find($clientUser->team_id);

        return redirect()->route('portal.dashboard', ['team' => $team?->slug ?? $clientUser->team_id]);
    }

    public function showForgotPassword(): InertiaResponse
    {
        return Inertia::render('ailes-invisibles/portal/ForgotPassword');
    }

    public function sendResetLink(Request $request): RedirectResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        $status = Password::broker('clients')->sendResetLink(
            $request->only('email'),
        );

        if ($status === Password::RESET_LINK_SENT) {
            return back()->with('status', __($status));
        }

        return back()->withErrors(['email' => __($status)]);
    }

    public function showResetPassword(Request $request): InertiaResponse
    {
        return Inertia::render('ailes-invisibles/portal/ResetPassword', [
            'email' => $request->query('email', ''),
            'token' => $request->route('token'),
        ]);
    }

    public function resetPassword(Request $request): RedirectResponse
    {
        $request->validate([
            'token' => ['required'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $status = Password::broker('clients')->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (ClientUser $user, string $password) {
                $user->forceFill([
                    'password' => bcrypt($password),
                    'password_set_at' => now(),
                ])->save();
            },
        );

        if ($status === Password::PASSWORD_RESET) {
            return redirect()->route('portal.login')->with('status', __($status));
        }

        return back()->withErrors(['email' => __($status)]);
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('client')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('portal.login');
    }

    public function magicLink(Request $request): RedirectResponse
    {
        $token = $request->route('token');

        $clientUser = ClientUser::where('access_token', $token)->first();

        if (! $clientUser) {
            return redirect()->route('portal.login')->withErrors([
                'email' => __('Invalid or expired magic link.'),
            ]);
        }

        Auth::guard('client')->login($clientUser);
        $clientUser->update(['last_login_at' => now()]);

        $team = Team::withoutGlobalScope(TeamScope::class)->find($clientUser->team_id);

        return redirect()->route('portal.dashboard', ['team' => $team?->slug ?? $clientUser->team_id]);
    }

    public function showAcceptInvitation(Request $request): InertiaResponse|RedirectResponse
    {
        $token = $request->route('token');

        $clientUser = ClientUser::where('access_token', $token)->first();

        if (! $clientUser) {
            return redirect()->route('portal.login')->with('status', __('This invitation link is invalid or has expired.'));
        }

        if ($clientUser->password_set_at !== null) {
            return redirect()->route('portal.login')->with('status', __('You have already accepted this invitation.'));
        }

        $team = Team::withoutGlobalScope(TeamScope::class)->find($clientUser->team_id);

        $footerLinks = $this->resolveTeamFooterLinks($clientUser->team_id);

        return Inertia::render('ailes-invisibles/portal/AcceptInvitation', [
            'clientEmail' => $clientUser->email,
            'teamName' => $team?->name ?? '',
            'teamIcon' => $team?->iconUrl(),
            'token' => $token,
            'footerLinks' => $footerLinks,
        ]);
    }

    public function acceptInvitation(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $token = $request->route('token');

        $clientUser = ClientUser::where('access_token', $token)->first();

        if (! $clientUser) {
            return redirect()->route('portal.login')->with('status', __('This invitation link is invalid or has expired.'));
        }

        if ($clientUser->password_set_at !== null) {
            return redirect()->route('portal.login')->with('status', __('You have already accepted this invitation.'));
        }

        $clientUser->update([
            'password' => Hash::make($validated['password']),
            'password_set_at' => now(),
            'access_token' => null,
            'last_login_at' => now(),
        ]);

        Auth::guard('client')->login($clientUser);

        $team = Team::withoutGlobalScope(TeamScope::class)->find($clientUser->team_id);

        return redirect()->route('portal.dashboard', ['team' => $team?->slug ?? $clientUser->team_id]);
    }

    protected function resolveTeamFooterLinks(int $teamId): array
    {
        $setting = TeamSetting::where('team_id', $teamId)
            ->where('key', 'footer_links')
            ->first();

        if (! $setting?->value) {
            return [];
        }

        return json_decode($setting->value, true) ?? [];
    }

    public function dashboard(Request $request): InertiaResponse
    {
        $clientUser = Auth::guard('client')->user();
        $client = $clientUser->client;

        $documentsCount = $client->documents()->count();
        $invoicesCount = $client->invoices()->count();
        $quotesCount = $client->quotes()->count();
        $unreadMessages = Message::whereHas('conversation.participants', function ($q) use ($clientUser) {
            $q->where('participant_type', ClientUser::class)
                ->where('participant_id', $clientUser->id);
        })
            ->where(function ($q) use ($clientUser) {
                $q->where('sender_type', '!=', ClientUser::class)
                    ->orWhere(fn ($q) => $q->where('sender_type', ClientUser::class)
                        ->where('sender_id', '!=', $clientUser->id));
            })
            ->whereDoesntHave('readReceipts', function ($q) use ($clientUser) {
                $q->where('reader_type', ClientUser::class)
                    ->where('reader_id', $clientUser->id);
            })
            ->count();
        $unpaidTotal = (float) $client->invoices()
            ->whereNotIn('status', ['paid', 'cancelled'])
            ->sum('total');

        return Inertia::render('ailes-invisibles/portal/Dashboard', [
            'client' => [
                'id' => $client->id,
                'first_name' => $client->first_name,
                'last_name' => $client->last_name,
                'email' => $client->email,
                'company_name' => $client->company_name,
            ],
            'documentsCount' => $documentsCount,
            'invoicesCount' => $invoicesCount,
            'quotesCount' => $quotesCount,
            'unreadMessages' => $unreadMessages,
            'unpaidTotal' => $unpaidTotal,
        ]);
    }

    public function documents(Request $request): InertiaResponse
    {
        $clientUser = Auth::guard('client')->user();
        $client = $clientUser->client;

        $documents = $client->documents()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (PortalDocument $document) => [
                'id' => $document->id,
                'title' => $document->title,
                'file_type' => $document->file_type,
                'file_size' => $document->file_size,
                'category' => $document->category,
                'status' => $document->status,
                'requires_signature' => $document->requires_signature,
                'is_signed' => $document->isSigned(),
                'expires_at' => $document->expires_at?->toISOString(),
                'created_at' => $document->created_at->toISOString(),
            ]);

        return Inertia::render('ailes-invisibles/portal/Documents', [
            'documents' => $documents,
        ]);
    }

    public function downloadDocument(Request $request)
    {
        $clientUser = Auth::guard('client')->user();
        $client = $clientUser->client;

        $document = PortalDocument::where('client_id', $client->id)
            ->findOrFail($request->route('id'));

        if (str_starts_with($document->file_path, 'nextcloud:')) {
            $remotePath = substr($document->file_path, strlen('nextcloud:'));
            $nextcloud = app(NextcloudStorageService::class);
            $tempPath = $nextcloud->downloadToTemp($remotePath);

            return response()->download($tempPath, $document->title.'.'.pathinfo($document->file_path, PATHINFO_EXTENSION))->deleteFileAfterSend();
        }

        return response()->download(
            storage_path('app/'.$document->file_path),
            $document->title.'.'.pathinfo($document->file_path, PATHINFO_EXTENSION)
        );
    }

    public function signDocument(Request $request): RedirectResponse
    {
        $clientUser = Auth::guard('client')->user();
        $client = $clientUser->client;

        $document = PortalDocument::where('client_id', $client->id)
            ->findOrFail($request->route('id'));

        $validated = $request->validate([
            'signature_data' => ['required', 'string'],
        ]);

        DocumentSignature::create([
            'document_id' => $document->id,
            'signer_type' => ClientUser::class,
            'signer_id' => $clientUser->id,
            'signature_data' => $validated['signature_data'],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'signed_at' => now(),
        ]);

        $document->update(['status' => 'signed']);

        return back()->with('toast', ['type' => 'success', 'message' => __('Document signed successfully.')]);
    }

    public function invoices(Request $request): InertiaResponse
    {
        $clientUser = Auth::guard('client')->user();
        $client = $clientUser->client;

        $invoices = $client->invoices()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($invoice) => [
                'id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'status' => $invoice->status,
                'issue_date' => $invoice->issue_date?->toDateString(),
                'due_date' => $invoice->due_date?->toDateString(),
                'subtotal' => (float) $invoice->subtotal,
                'tax_amount' => (float) $invoice->tax_amount,
                'total' => (float) $invoice->total,
                'paid_amount' => (float) $invoice->paid_amount,
                'has_file' => ! empty($invoice->file_path),
                'created_at' => $invoice->created_at->toISOString(),
            ]);

        return Inertia::render('ailes-invisibles/portal/Invoices', [
            'invoices' => $invoices,
        ]);
    }

    public function quotes(Request $request): InertiaResponse
    {
        $clientUser = Auth::guard('client')->user();
        $client = $clientUser->client;

        $quotes = $client->quotes()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($quote) => [
                'id' => $quote->id,
                'quote_number' => $quote->quote_number,
                'status' => $quote->status,
                'subject' => $quote->subject,
                'valid_until' => $quote->valid_until?->toDateString(),
                'subtotal' => (float) $quote->subtotal,
                'tax_amount' => (float) $quote->tax_amount,
                'total' => (float) $quote->total,
                'has_file' => ! empty($quote->file_path),
                'created_at' => $quote->created_at->toISOString(),
            ]);

        return Inertia::render('ailes-invisibles/portal/Quotes', [
            'quotes' => $quotes,
        ]);
    }

    public function createConversation(Request $request): RedirectResponse
    {
        $clientUser = Auth::guard('client')->user();

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
        ]);

        $conversation = Conversation::create([
            'team_id' => $clientUser->team_id,
            'title' => $validated['title'],
            'type' => 'direct',
            'created_by_type' => ClientUser::class,
            'created_by_id' => $clientUser->id,
        ]);

        ConversationParticipant::create([
            'conversation_id' => $conversation->id,
            'participant_type' => ClientUser::class,
            'participant_id' => $clientUser->id,
            'role' => 'owner',
            'joined_at' => now(),
        ]);

        app(ConversationAuditService::class)->log($conversation, 'created', null, ['via' => 'portal']);

        $team = Team::withoutGlobalScope(TeamScope::class)->find($clientUser->team_id);

        return redirect()->route('portal.chat.inbox', [
            'team' => $team?->slug ?? $clientUser->team_id,
            'conversation' => $conversation->id,
        ]);
    }

    public function redirectToInbox(Request $request): RedirectResponse
    {
        return redirect()->route('portal.chat.inbox', ['team' => $request->route('team')]);
    }

    public function redirectToInboxWithConversation(Request $request): RedirectResponse
    {
        return redirect()->route('portal.chat.inbox', [
            'team' => $request->route('team'),
            'conversation' => $request->route('id'),
        ]);
    }

    public function inbox(Request $request): InertiaResponse
    {
        $clientUser = Auth::guard('client')->user();

        $conversationIds = ConversationParticipant::where('participant_type', ClientUser::class)
            ->where('participant_id', $clientUser->id)
            ->pluck('conversation_id');

        $selectedId = $request->query('conversation');

        $allConversations = Conversation::whereIn('id', $conversationIds)
            ->with(['participants', 'messages' => fn ($q) => $q->latest()->limit(1)])
            ->orderBy('last_message_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        // Bulk-load admin user names to avoid N+1
        $adminUserIds = $allConversations->pluck('participants')->flatten(1)
            ->where('participant_type', User::class)
            ->pluck('participant_id')->unique()->values()->toArray();
        $usersMap = User::whereIn('id', $adminUserIds)->pluck('name', 'id');

        $conversations = $allConversations->map(function (Conversation $c) use ($clientUser) {
            $unreadCount = $c->messages()
                ->where(function ($q) use ($clientUser) {
                    $q->where('sender_type', '!=', ClientUser::class)
                        ->orWhere(fn ($q) => $q->where('sender_type', ClientUser::class)
                            ->where('sender_id', '!=', $clientUser->id));
                })
                ->whereDoesntHave('readReceipts', function ($q) use ($clientUser) {
                    $q->where('reader_type', ClientUser::class)
                        ->where('reader_id', $clientUser->id);
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
                        ? $usersMap[$p->participant_id] ?? 'Admin'
                        : $clientUser->client?->full_name ?? 'Client',
                    'company_name' => $p->participant_type === ClientUser::class
                        ? $clientUser->client?->company_name
                        : null,
                ]),
            ];
        });

        $selectedConversation = null;
        if ($selectedId && in_array($selectedId, $conversationIds->toArray())) {
            $conv = Conversation::with(['participants', 'messages.encryptedKeys', 'messages.readReceipts', 'auditLogs'])
                ->find($selectedId);
            if ($conv) {
                // Mark messages as read when viewing conversation
                $this->markPortalConversationRead($conv, $clientUser);

                // Bulk-load admin names for this conversation's participants, senders, and actors
                $detailUserIds = $conv->participants->where('participant_type', User::class)->pluck('participant_id')
                    ->merge($conv->messages->where('sender_type', User::class)->pluck('sender_id'))
                    ->merge($conv->auditLogs->where('actor_type', User::class)->pluck('actor_id'))
                    ->unique()->values()->toArray();
                $detailUsersMap = User::whereIn('id', $detailUserIds)->pluck('name', 'id');

                $selectedConversation = [
                    'id' => $conv->id,
                    'title' => $conv->title,
                    'type' => $conv->type,
                    'archived_at' => $conv->archived_at?->toISOString(),
                    'last_message_at' => $conv->last_message_at?->toISOString(),
                    'participants' => $conv->participants->map(fn ($p) => [
                        'id' => $p->id,
                        'participant_type' => $p->participant_type,
                        'participant_id' => $p->participant_id,
                        'role' => $p->role,
                        'joined_at' => $p->joined_at?->toISOString(),
                        'name' => $p->participant_type === User::class
                            ? $detailUsersMap[$p->participant_id] ?? 'Admin'
                            : $clientUser->client?->full_name ?? 'Client',
                        'company_name' => $p->participant_type === ClientUser::class
                            ? $clientUser->client?->company_name
                            : null,
                    ]),
                    'messages' => $conv->messages->map(fn ($message) => [
                        'id' => $message->id,
                        'sender_type' => $message->sender_type,
                        'sender_id' => $message->sender_id,
                        'sender_name' => $message->sender_type === ClientUser::class
                            ? $clientUser->client?->full_name ?? 'Client'
                            : $detailUsersMap[$message->sender_id] ?? 'Admin',
                        'encrypted_content' => $message->encrypted_content,
                        'content' => $this->decryptContent($message->encrypted_content),
                        'iv' => $message->iv,
                        'type' => $message->type,
                        'file_name' => $message->file_name,
                        'file_size' => $message->file_size,
                        'is_mine' => $message->sender_type === ClientUser::class && $message->sender_id === $clientUser->id,
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
                    'audit_logs' => $conv->auditLogs->map(fn ($log) => [
                        'id' => $log->id,
                        'event' => $log->event,
                        'actor_name' => $log->actor_type === ClientUser::class
                            ? $clientUser->client?->full_name
                            : ($log->actor_type ? $detailUsersMap[$log->actor_id] ?? null : null),
                        'metadata' => $log->metadata,
                        'created_at' => $log->created_at->toISOString(),
                    ]),
                ];
            }
        }

        $counts = [
            'active' => Conversation::whereIn('id', $conversationIds)->notArchived()->count(),
            'archived' => Conversation::whereIn('id', $conversationIds)->archived()->count(),
            'unassigned' => 0,
        ];

        return Inertia::render('ailes-invisibles/portal/Inbox', [
            'conversations' => $conversations,
            'selected_conversation' => $selectedConversation,
            'counts' => $counts,
        ]);
    }

    public function markAsReadPortal(Request $request)
    {
        $clientUser = Auth::guard('client')->user();
        $conversationId = (int) $request->route('id');

        $isParticipant = ConversationParticipant::where('participant_type', ClientUser::class)
            ->where('participant_id', $clientUser->id)
            ->where('conversation_id', $conversationId)
            ->exists();

        if (! $isParticipant) {
            abort(403);
        }

        $messageIds = Message::where('conversation_id', $conversationId)
            ->where(function ($q) use ($clientUser) {
                $q->where('sender_type', '!=', ClientUser::class)
                    ->orWhere(fn ($q) => $q->where('sender_type', ClientUser::class)
                        ->where('sender_id', '!=', $clientUser->id));
            })
            ->pluck('id');

        foreach ($messageIds as $messageId) {
            MessageReadReceipt::firstOrCreate([
                'message_id' => $messageId,
                'reader_type' => ClientUser::class,
                'reader_id' => $clientUser->id,
            ], ['read_at' => now()]);
        }

        return back();
    }

    public function updateTitle(Request $request)
    {
        $id = $request->route('id');
        $clientUser = Auth::guard('client')->user();

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
        ]);

        $conversation = Conversation::find($id);
        if (! $conversation || ! $this->isParticipant($conversation->id, $clientUser->id)) {
            abort(403);
        }

        $conversation->update(['title' => $validated['title']]);
        app(ConversationAuditService::class)->log($conversation, 'renamed', $clientUser, ['title' => $validated['title']]);

        return back();
    }

    public function archiveConversation(Request $request)
    {
        $clientUser = Auth::guard('client')->user();
        $conversationId = $request->route('id');

        $conversation = Conversation::find($conversationId);
        if (! $conversation || ! $this->isParticipant($conversation->id, $clientUser->id)) {
            abort(403);
        }

        $conversation->update(['archived_at' => now()]);
        app(ConversationAuditService::class)->log($conversation, 'archived', $clientUser, ['via' => 'portal']);

        return back();
    }

    public function unarchiveConversation(Request $request)
    {
        $clientUser = Auth::guard('client')->user();
        $conversationId = $request->route('id');

        $conversation = Conversation::find($conversationId);
        if (! $conversation || ! $this->isParticipant($conversation->id, $clientUser->id)) {
            abort(403);
        }

        $conversation->update(['archived_at' => null]);
        app(ConversationAuditService::class)->log($conversation, 'unarchived', $clientUser, ['via' => 'portal']);

        return back();
    }

    public function downloadAttachmentPortal(Request $request)
    {
        $clientUser = Auth::guard('client')->user();
        $conversationId = $request->route('id');

        if (! $this->isParticipant($conversationId, $clientUser->id)) {
            abort(403);
        }

        $message = Message::where('conversation_id', $conversationId)
            ->findOrFail($request->route('messageId'));

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

    public function showConversation(Request $request): RedirectResponse
    {
        return redirect()->route('portal.chat.inbox', [
            'team' => $request->route('team'),
            'conversation' => $request->route('id'),
        ]);
    }

    public function sendMessage(Request $request)
    {
        $id = $request->route('id');
        $clientUser = Auth::guard('client')->user();

        $validated = $request->validate([
            'encrypted_content' => ['required', 'string'],
            'iv' => ['required', 'string'],
            'encrypted_keys' => ['required', 'array'],
            'encrypted_keys.*.participant_type' => ['required', 'string'],
            'encrypted_keys.*.participant_id' => ['required', 'integer'],
            'encrypted_keys.*.encrypted_key' => ['required', 'string'],
        ]);

        $message = Message::create([
            'conversation_id' => $id,
            'sender_type' => ClientUser::class,
            'sender_id' => $clientUser->id,
            'encrypted_content' => Crypt::encryptString($validated['encrypted_content']),
            'iv' => $validated['iv'],
            'type' => 'text',
        ]);

        foreach ($validated['encrypted_keys'] as $key) {
            MessageEncryptedKey::create([
                'message_id' => $message->id,
                'participant_type' => $key['participant_type'],
                'participant_id' => $key['participant_id'],
                'encrypted_key' => $key['encrypted_key'],
            ]);
        }

        $conversation = Conversation::find($id);
        $conversation?->update(['last_message_at' => now()]);

        // Broadcast to other participants via WebSocket
        if ($conversation) {
            broadcast(new NewMessage(
                $conversation->id,
                $message->id,
                ClientUser::class,
                $clientUser->id,
                $clientUser->client?->full_name ?? 'Client',
                $validated['encrypted_content'],
                $message->type,
                $message->created_at->toISOString(),
            ));
        }

        // Notify admin participants
        if ($conversation) {
            $adminParticipants = $conversation->participants()
                ->where('participant_type', User::class)
                ->get();

            foreach ($adminParticipants as $participant) {
                Notification::create([
                    'team_id' => $conversation->team_id,
                    'user_id' => $participant->participant_id,
                    'type' => 'message',
                    'title' => __('New message'),
                    'body' => __(':name sent you a message', ['name' => $clientUser->client?->full_name ?? 'Client']),
                    'data' => ['url' => url("/{$conversation->team_id}/ai/conversations/inbox?conversation={$conversation->id}")],
                ]);
            }

            app(ConversationAuditService::class)->log($conversation, 'message_sent', $clientUser);
        }

        return back()->with('toast', ['type' => 'success', 'message' => __('Message sent.')]);
    }

    public function downloadInvoice(Request $request)
    {
        $clientUser = Auth::guard('client')->user();
        $client = $clientUser->client;

        $invoice = Invoice::where('client_id', $client->id)
            ->findOrFail($request->route('id'));

        if (! $invoice->file_path) {
            abort(404, __('No file attached to this invoice.'));
        }

        if (str_starts_with($invoice->file_path, 'nextcloud:')) {
            $remotePath = substr($invoice->file_path, strlen('nextcloud:'));
            $nextcloud = app(NextcloudStorageService::class);
            $tempPath = $nextcloud->downloadToTemp($remotePath);

            return response()->download($tempPath, $invoice->file_name ?? $invoice->invoice_number.'.pdf')->deleteFileAfterSend();
        }

        return response()->download(
            storage_path('app/'.$invoice->file_path),
            $invoice->file_name ?? $invoice->invoice_number.'.pdf'
        );
    }

    public function downloadQuote(Request $request)
    {
        $clientUser = Auth::guard('client')->user();
        $client = $clientUser->client;

        $quote = Quote::where('client_id', $client->id)
            ->findOrFail($request->route('id'));

        if (! $quote->file_path) {
            abort(404, __('No file attached to this quote.'));
        }

        if (str_starts_with($quote->file_path, 'nextcloud:')) {
            $remotePath = substr($quote->file_path, strlen('nextcloud:'));
            $nextcloud = app(NextcloudStorageService::class);
            $tempPath = $nextcloud->downloadToTemp($remotePath);

            return response()->download($tempPath, $quote->file_name ?? $quote->quote_number.'.pdf')->deleteFileAfterSend();
        }

        return response()->download(
            storage_path('app/'.$quote->file_path),
            $quote->file_name ?? $quote->quote_number.'.pdf'
        );
    }

    public function settings(Request $request): InertiaResponse
    {
        $clientUser = Auth::guard('client')->user();
        $client = $clientUser->client;

        return Inertia::render('ailes-invisibles/portal/Settings', [
            'client' => [
                'id' => $client->id,
                'first_name' => $client->first_name,
                'last_name' => $client->last_name,
                'email' => $client->email,
                'phone' => $client->phone,
                'address_line1' => $client->address_line1,
                'address_line2' => $client->address_line2,
                'city' => $client->city,
                'postal_code' => $client->postal_code,
                'country' => $client->country,
                'company_name' => $client->company_name,
            ],
        ]);
    }

    public function updateProfile(Request $request): RedirectResponse
    {
        $clientUser = Auth::guard('client')->user();
        $client = $clientUser->client;

        $validated = $request->validate([
            'first_name' => ['sometimes', 'required', 'string', 'max:255'],
            'last_name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address_line1' => ['nullable', 'string', 'max:255'],
            'address_line2' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'country' => ['nullable', 'string', 'size:2'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ]);

        $clientData = collect($validated)
            ->except('password')
            ->toArray();

        $client->update($clientData);

        if (! empty($validated['password'])) {
            $clientUser->update([
                'password' => Hash::make($validated['password']),
            ]);
        }

        return back()->with('toast', ['type' => 'success', 'message' => __('Profile updated.')]);
    }

    public function updatePassword(Request $request): RedirectResponse
    {
        $clientUser = Auth::guard('client')->user();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (! Hash::check($validated['current_password'], $clientUser->password)) {
            return back()->withErrors(['current_password' => __('The current password is incorrect.')]);
        }

        $clientUser->update([
            'password' => $validated['password'],
        ]);

        return back()->with('toast', ['type' => 'success', 'message' => __('Password updated.')]);
    }

    public function updateLocale(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'locale' => ['required', 'string', 'in:en,fr'],
        ]);

        $clientUser = Auth::guard('client')->user();
        $clientUser->update(['locale' => $validated['locale']]);

        app()->setLocale($validated['locale']);

        return back()->with('toast', ['type' => 'success', 'message' => __('Language updated.')]);
    }

    private function decryptContent(string $encrypted): string
    {
        try {
            return Crypt::decryptString($encrypted);
        } catch (\Throwable) {
            try {
                return base64_decode($encrypted);
            } catch (\Throwable) {
                return $encrypted;
            }
        }
    }

    private function isParticipant(int $conversationId, int $clientUserId): bool
    {
        return ConversationParticipant::where('conversation_id', $conversationId)
            ->where('participant_type', ClientUser::class)
            ->where('participant_id', $clientUserId)
            ->exists();
    }

    private function markPortalConversationRead(Conversation $conversation, ClientUser $clientUser): void
    {
        $messageIds = $conversation->messages()
            ->where(function ($q) use ($clientUser) {
                $q->where('sender_type', '!=', ClientUser::class)
                    ->orWhere(fn ($q) => $q->where('sender_type', ClientUser::class)
                        ->where('sender_id', '!=', $clientUser->id));
            })
            ->pluck('id');

        foreach ($messageIds as $messageId) {
            MessageReadReceipt::firstOrCreate([
                'message_id' => $messageId,
                'reader_type' => ClientUser::class,
                'reader_id' => $clientUser->id,
            ], ['read_at' => now()]);
        }
    }
}
