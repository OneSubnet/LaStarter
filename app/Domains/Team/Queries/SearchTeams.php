<?php

namespace App\Domains\Team\Queries;

use App\Domain\Queries\Query;

/**
 * Search Teams Query
 */
class SearchTeams implements Query
{
    public function __construct(
        public readonly string $searchTerm,
        public readonly int $perPage = 15,
    ) {}

    public function queryId(): string
    {
        return 'teams:search:'.md5($this->searchTerm);
    }
}
