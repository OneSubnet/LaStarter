<?php

namespace App\Domains\Cms;

use Illuminate\Database\Eloquent\Model;

/**
 * Interface for DTOs that can be transformed to models.
 *
 * @template T of Model
 */
interface DataToModel
{
    /**
     * Transform the DTO data to the given model.
     *
     * @param  T  $model
     * @return T
     */
    public function toModel(Model $model): Model;
}
