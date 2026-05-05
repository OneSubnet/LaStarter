<?php

namespace App\Http\Api\Resources\Team;

use App\Http\Api\Resources\ApiResource;
use Illuminate\Http\Request;

class TeamResource extends ApiResource
{
    protected function transform(Request $request): array
    {
        return [
            'name' => $this->resource->name,
            'slug' => $this->resource->slug,
            'isPersonal' => $this->resource->is_personal,
            'isActive' => $this->resource->is_active,
            'locale' => $this->resource->locale,
            'iconUrl' => $this->resource->iconUrl(),
            'createdAt' => $this->resource->created_at?->toIso8601String(),
            'updatedAt' => $this->resource->updated_at?->toIso8601String(),
        ];
    }
}
