<?php

namespace App\Domain\Queries;

/**
 * Query Handler Interface
 *
 * Handles the execution of a query.
 * Each query should have a dedicated handler.
 *
 * @template TQuery of Query
 */
interface QueryHandler
{
    /**
     * Handle the query.
     *
     * @param  TQuery  $query
     */
    public function handle(Query $query): mixed;
}
