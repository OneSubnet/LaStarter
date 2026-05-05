<?php

namespace App\Domains\Team\Queries\Handlers;

use App\Domain\Queries\Query;
use App\Domain\Queries\QueryHandler;
use App\Domains\Team\Queries\SearchTeams;
use App\Models\Team;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Search Teams Handler
 */
class SearchTeamsHandler implements QueryHandler
{
    public function handle(Query|SearchTeams $query): LengthAwarePaginator
    {
        return Team::search($query->searchTerm, 'name', $query->perPage);
    }
}
