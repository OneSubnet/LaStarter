<?php

namespace App\Core\Context;

use App\Models\Membership;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\Request;

class AppContext
{
    protected ?User $user = null;

    protected ?Team $team = null;

    protected ?Membership $membership = null;

    protected ?array $permissions = null;

    public function user(): ?User
    {
        if ($this->user !== null) {
            return $this->user;
        }

        try {
            $this->user = app(Request::class)->user();
        } catch (\Throwable) {
            return null;
        }

        return $this->user;
    }

    public function team(): ?Team
    {
        if ($this->team !== null) {
            return $this->team;
        }

        return $this->team = $this->user()?->currentTeam;
    }

    public function membership(): ?Membership
    {
        if ($this->membership !== null) {
            return $this->membership;
        }

        $user = $this->user();
        $team = $this->team();

        if (! $user || ! $team) {
            return null;
        }

        return $this->membership = $team->memberships()
            ->where('user_id', $user->id)
            ->first();
    }

    public function permissions(): array
    {
        if ($this->permissions !== null) {
            return $this->permissions;
        }

        $user = $this->user();

        if (! $user) {
            return $this->permissions = [];
        }

        return $this->permissions = $user->getAllPermissions()
            ->pluck('name')
            ->toArray();
    }

    public function reset(): void
    {
        $this->user = null;
        $this->team = null;
        $this->membership = null;
        $this->permissions = null;
    }
}
