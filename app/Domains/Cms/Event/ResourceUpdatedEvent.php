<?php

namespace App\Domains\Cms\Event;

use Illuminate\Database\Eloquent\Model;

class ResourceUpdatedEvent extends ResourceEvent
{
    public function getAction(): string
    {
        return 'updated';
    }

    /**
     * Get the model instance.
     */
    public function getModel(): Model
    {
        return $this->model;
    }
}
