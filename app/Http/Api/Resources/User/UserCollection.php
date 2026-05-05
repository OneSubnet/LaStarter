<?php

namespace App\Http\Api\Resources\User;

use App\Http\Api\Resources\ApiCollection;
use Illuminate\Http\Request;

class UserCollection extends ApiCollection
{
    /**
     * Transform the resource collection into an array.
     */
    public function toArray(Request $request)
    {
        return [
            'data' => UserResource::collection($this->collection),
            'pagination' => [
                'current_page' => $this->resource->currentPage(),
                'last_page' => $this->resource->lastPage(),
                'per_page' => $this->resource->perPage(),
                'total' => $this->resource->total(),
                'from' => $this->resource->firstItem(),
                'to' => $this->resource->lastItem(),
            ],
        ];
    }
}
