<?php

namespace App\Domains\User\Events;

use App\Models\User;

class UserLoggedInEvent extends UserEvent
{
    public function __construct(
        User $user,
        public readonly string $ipAddress,
        public readonly ?string $userAgent = null,
    ) {
        parent::__construct($user, $user->id, [
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
        ]);
    }

    public function getAction(): string
    {
        return 'logged_in';
    }
}
