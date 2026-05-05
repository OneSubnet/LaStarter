<?php

namespace App\Domains\Team\Queries;

use App\Domain\Queries\Query;

/**
 * Get Teams For User Query
 */
class GetTeamsForUser implements Query
{
    public function __construct(
        public readonly int $userId,
        public readonly int $perPage = 15,
    ) {}

    public function queryId(): string
    {
        return "teams:user:{$this->userId}";
    }
}
