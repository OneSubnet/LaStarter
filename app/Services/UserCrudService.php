<?php

namespace App\Services;

use App\Domains\User\Data\UserRequestData;
use App\Models\User;

/**
 * User CRUD Service
 *
 * Handles CRUD operations for User domain.
 * Uses the generic CrudService with User-specific configuration.
 */
class UserCrudService extends CrudService
{
    protected string $model = User::class;

    protected string $requestDataType = UserRequestData::class;
}
