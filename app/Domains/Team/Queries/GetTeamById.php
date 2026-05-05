<?php

namespace App\Domains\Team\Queries;

use App\Domain\Queries\Query;

/**
 * Get Team By Id Query
 */
class GetTeamById implements Query
{
    public function __construct(
        public readonly int $teamId,
        public readonly array $relations = [],
    ) {}

    public function queryId(): string
    {
        return 'team:'.$this->teamId;
    }
}
