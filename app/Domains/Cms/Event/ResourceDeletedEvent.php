<?php

namespace App\Domains\Cms\Event;

use Illuminate\Database\Eloquent\Model;

class ResourceDeletedEvent extends ResourceEvent
{
    public function getAction(): string
    {
        return 'deleted';
    }

    /**
     * Get the model instance (may be soft-deleted).
     */
    public function getModel(): Model
    {
        return $this->model;
    }
}
