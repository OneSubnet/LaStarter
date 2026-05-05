<?php

namespace App\Domains\Team\Queries\Handlers;

use App\Domain\Queries\Query;
use App\Domain\Queries\QueryHandler;
use App\Domains\Team\Queries\GetTeamsForUser;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Get Teams For User Handler
 */
class GetTeamsForUserHandler implements QueryHandler
{
    public function handle(Query|GetTeamsForUser $query): LengthAwarePaginator
    {
        $user = User::find($query->userId);

        if (! $user) {
            throw new \InvalidArgumentException("User not found: {$query->userId}");
        }

        return $user->teams()->paginate($query->perPage);
    }
}
