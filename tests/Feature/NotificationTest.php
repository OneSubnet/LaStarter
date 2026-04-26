<?php

use App\Models\Notification;
use App\Models\User;
use Tests\Concerns\CreatesTeams;

uses(CreatesTeams::class);

beforeEach(function () {
    [$this->owner, $this->team] = $this->createTeamWithOwner('Test Team');
    setupTeamAuth($this->owner, $this->team);
});

describe('Notification model', function () {
    test('can create notification with team scope', function () {
        $notification = Notification::create([
            'team_id' => $this->team->id,
            'user_id' => $this->owner->id,
            'type' => 'test',
            'title' => 'Test notification',
            'body' => 'Test body',
            'data' => ['url' => '/test'],
        ]);

        expect($notification->team_id)->toBe($this->team->id);
        expect($notification->data)->toBe(['url' => '/test']);
        expect($notification->read_at)->toBeNull();
    });

    test('markAsRead sets read_at timestamp', function () {
        $notification = Notification::create([
            'team_id' => $this->team->id,
            'user_id' => $this->owner->id,
            'type' => 'test',
            'title' => 'Test',
        ]);

        expect($notification->read_at)->toBeNull();

        $notification->markAsRead();

        expect($notification->fresh()->read_at)->not->toBeNull();
    });

    test('markAsRead is idempotent', function () {
        $notification = Notification::create([
            'team_id' => $this->team->id,
            'user_id' => $this->owner->id,
            'type' => 'test',
            'title' => 'Test',
        ]);

        $notification->markAsRead();
        $firstReadAt = $notification->fresh()->read_at;

        $notification->markAsRead();

        expect($notification->fresh()->read_at->timestamp)->toBe($firstReadAt->timestamp);
    });

    test('unread scope filters correctly', function () {
        Notification::create([
            'team_id' => $this->team->id,
            'user_id' => $this->owner->id,
            'type' => 'test',
            'title' => 'Unread',
        ]);

        Notification::create([
            'team_id' => $this->team->id,
            'user_id' => $this->owner->id,
            'type' => 'test',
            'title' => 'Read',
            'read_at' => now(),
        ]);

        $unread = Notification::forUser($this->owner->id)->unread()->get();
        expect($unread)->toHaveCount(1);
        expect($unread->first()->title)->toBe('Unread');
    });

    test('forUser scope filters by user', function () {
        $otherUser = User::factory()->create();

        Notification::create([
            'team_id' => $this->team->id,
            'user_id' => $this->owner->id,
            'type' => 'test',
            'title' => 'Owner notification',
        ]);

        Notification::create([
            'team_id' => $this->team->id,
            'user_id' => $otherUser->id,
            'type' => 'test',
            'title' => 'Other notification',
        ]);

        $notifications = Notification::forUser($this->owner->id)->get();
        expect($notifications)->toHaveCount(1);
        expect($notifications->first()->title)->toBe('Owner notification');
    });
});

describe('NotificationController', function () {
    test('index returns user notifications', function () {
        Notification::create([
            'team_id' => $this->team->id,
            'user_id' => $this->owner->id,
            'type' => 'test',
            'title' => 'Test notification',
        ]);

        $response = $this->get(route('notifications.index', ['current_team' => $this->team->slug]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->has('notifications.data'));
    });

    test('markAsRead marks notification and redirects', function () {
        $notification = Notification::create([
            'team_id' => $this->team->id,
            'user_id' => $this->owner->id,
            'type' => 'test',
            'title' => 'Test',
        ]);

        $response = $this->post(
            route('notifications.read', ['current_team' => $this->team->slug, 'id' => $notification->id]),
        );

        $response->assertRedirect();
        expect($notification->fresh()->read_at)->not->toBeNull();
    });

    test('markAsRead redirects to data url when present', function () {
        $notification = Notification::create([
            'team_id' => $this->team->id,
            'user_id' => $this->owner->id,
            'type' => 'test',
            'title' => 'Test',
            'data' => ['url' => "/{$this->team->slug}/dashboard"],
        ]);

        $response = $this->post(
            route('notifications.read', ['current_team' => $this->team->slug, 'id' => $notification->id]),
        );

        $response->assertRedirect("/{$this->team->slug}/dashboard");
    });

    test('markAllAsRead marks all unread notifications', function () {
        Notification::create([
            'team_id' => $this->team->id,
            'user_id' => $this->owner->id,
            'type' => 'test',
            'title' => 'First',
        ]);

        Notification::create([
            'team_id' => $this->team->id,
            'user_id' => $this->owner->id,
            'type' => 'test',
            'title' => 'Second',
        ]);

        $response = $this->post(route('notifications.read-all', ['current_team' => $this->team->slug]));

        $response->assertRedirect();
        expect(Notification::forUser($this->owner->id)->unread()->count())->toBe(0);
    });

    test('unreadCount returns correct count', function () {
        Notification::create([
            'team_id' => $this->team->id,
            'user_id' => $this->owner->id,
            'type' => 'test',
            'title' => 'Unread 1',
        ]);

        Notification::create([
            'team_id' => $this->team->id,
            'user_id' => $this->owner->id,
            'type' => 'test',
            'title' => 'Unread 2',
        ]);

        Notification::create([
            'team_id' => $this->team->id,
            'user_id' => $this->owner->id,
            'type' => 'test',
            'title' => 'Read',
            'read_at' => now(),
        ]);

        $response = $this->get(route('notifications.unread-count', ['current_team' => $this->team->slug]));

        $response->assertOk();
        $response->assertJson(['count' => 2]);
    });

    test('user cannot mark other users notifications as read', function () {
        $otherUser = User::factory()->create();
        $notification = Notification::create([
            'team_id' => $this->team->id,
            'user_id' => $otherUser->id,
            'type' => 'test',
            'title' => 'Other user notification',
        ]);

        $response = $this->post(
            route('notifications.read', ['current_team' => $this->team->slug, 'id' => $notification->id]),
        );

        $response->assertNotFound();
    });
});
