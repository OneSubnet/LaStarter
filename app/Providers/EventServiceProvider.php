<?php

namespace App\Providers;

use App\Core\Hooks\Events\ExtensionStateChangedEvent;
use App\Core\Hooks\Events\ModuleBootEvent;
use App\Domains\Cms\Event\ResourceCreatedEvent;
use App\Domains\Cms\Event\ResourceDeletedEvent;
use App\Domains\Cms\Event\ResourceUpdatedEvent;
use App\Domains\Cms\Listeners\LogResourceCreatedListener;
use App\Domains\Cms\Listeners\LogResourceDeletedListener;
use App\Domains\Cms\Listeners\LogResourceUpdatedListener;
use App\Domains\Team\Events\MemberAddedEvent;
use App\Domains\Team\Events\MemberRemovedEvent;
use App\Domains\Team\Events\TeamCreatedEvent;
use App\Domains\Team\Events\TeamDeletedEvent;
use App\Domains\Team\Events\TeamUpdatedEvent;
use App\Domains\Team\Listeners\LogMemberAddedListener;
use App\Domains\Team\Listeners\LogMemberRemovedListener;
use App\Domains\Team\Listeners\LogTeamActionListener;
use App\Domains\User\Events\UserCreatedEvent;
use App\Domains\User\Events\UserDeletedEvent;
use App\Domains\User\Events\UserLoggedInEvent;
use App\Domains\User\Events\UserUpdatedEvent;
use App\Domains\User\Listeners\LogUserActionListener;
use App\Domains\User\Listeners\LogUserLoggedInListener;
use App\Events\NewMessage;
use App\Listeners\NotifyNewMessage;
use App\Listeners\ProcessExtensionStateChange;
use App\Listeners\SetupModuleContext;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],

        // CMS Resource Events
        ResourceCreatedEvent::class => [
            LogResourceCreatedListener::class,
        ],
        ResourceUpdatedEvent::class => [
            LogResourceUpdatedListener::class,
        ],
        ResourceDeletedEvent::class => [
            LogResourceDeletedListener::class,
        ],

        // Team Events
        TeamCreatedEvent::class => [
            LogTeamActionListener::class,
        ],
        TeamUpdatedEvent::class => [
            LogTeamActionListener::class,
        ],
        TeamDeletedEvent::class => [
            LogTeamActionListener::class,
        ],
        MemberAddedEvent::class => [
            LogMemberAddedListener::class,
        ],
        MemberRemovedEvent::class => [
            LogMemberRemovedListener::class,
        ],

        // Module Events
        ModuleBootEvent::class => [
            SetupModuleContext::class,
        ],
        ExtensionStateChangedEvent::class => [
            ProcessExtensionStateChange::class,
        ],

        // Messaging
        NewMessage::class => [
            NotifyNewMessage::class,
        ],

        // User Events
        UserCreatedEvent::class => [
            LogUserActionListener::class,
        ],
        UserUpdatedEvent::class => [
            LogUserActionListener::class,
        ],
        UserDeletedEvent::class => [
            LogUserActionListener::class,
        ],
        UserLoggedInEvent::class => [
            LogUserLoggedInListener::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        parent::boot();
    }
}
