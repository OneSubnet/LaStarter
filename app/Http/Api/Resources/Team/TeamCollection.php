<?php

namespace App\Http\Api\Resources\Team;

use App\Http\Api\Resources\ApiCollection;
use Illuminate\Http\Request;

class TeamCollection extends ApiCollection
{
    /**
     * Transform the resource collection into an array.
     */
    public function toArray(Request $request)
    {
        return [
            'data' => TeamResource::collection($this->collection),
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
