<?php

namespace App\Domains\Cms\Event;

use Illuminate\Database\Eloquent\Model;

class ResourceCreatedEvent extends ResourceEvent
{
    public function getAction(): string
    {
        return 'created';
    }

    /**
     * Get the model instance.
     */
    public function getModel(): Model
    {
        return $this->model;
    }
}
