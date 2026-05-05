<?php

namespace App\Services;

use App\Domains\Team\Data\TeamRequestData;
use App\Models\Team;

/**
 * Team CRUD Service
 *
 * Handles CRUD operations for Team domain.
 * Uses the generic CrudService with Team-specific configuration.
 */
class TeamCrudService extends CrudService
{
    protected string $model = Team::class;

    protected string $requestDataType = TeamRequestData::class;
}
