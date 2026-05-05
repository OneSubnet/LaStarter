<?php

namespace App\Domain\Queries;

/**
 * Query Interface
 *
 * Represents a request for information.
 * Queries should not modify system state.
 */
interface Query
{
    /**
     * Get the query unique identifier.
     */
    public function queryId(): string;
}
