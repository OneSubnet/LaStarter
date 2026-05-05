<?php

namespace App\Domains\Team\Queries\Handlers;

use App\Domain\Queries\Query;
use App\Domain\Queries\QueryHandler;
use App\Domains\Team\Queries\GetTeamById;
use App\Models\Team;

/**
 * Get Team By Id Handler
 */
class GetTeamByIdHandler implements QueryHandler
{
    public function handle(Query|GetTeamById $query): ?Team
    {
        return Team::with($query->relations)->find($query->teamId);
    }
}
