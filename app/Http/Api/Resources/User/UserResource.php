<?php

namespace App\Http\Api\Resources\User;

use App\Http\Api\Resources\ApiResource;
use Illuminate\Http\Request;

class UserResource extends ApiResource
{
    protected function transform(Request $request): array
    {
        return [
            'name' => $this->resource->name,
            'email' => $this->resource->email,
            'locale' => $this->resource->locale,
            'onboardingCompleted' => (bool) $this->resource->onboarding_completed,
            'onboardingStep' => $this->resource->onboarding_step,
            'currentTeamId' => $this->resource->current_team_id,
            'createdAt' => $this->resource->created_at?->toIso8601String(),
            'updatedAt' => $this->resource->updated_at?->toIso8601String(),
        ];
    }
}
