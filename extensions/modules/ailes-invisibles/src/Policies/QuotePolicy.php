<?php

namespace Modules\AilesInvisibles\Policies;

use App\Models\User;
use Modules\AilesInvisibles\Models\Quote;

class QuotePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('ai.quote.view');
    }

    public function view(User $user, Quote $quote): bool
    {
        return $user->hasPermissionTo('ai.quote.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('ai.quote.create');
    }

    public function update(User $user, Quote $quote): bool
    {
        return $user->hasPermissionTo('ai.quote.update');
    }

    public function delete(User $user, Quote $quote): bool
    {
        return $user->hasPermissionTo('ai.quote.delete');
    }

    public function send(User $user, Quote $quote): bool
    {
        return $user->hasPermissionTo('ai.quote.send');
    }
}
