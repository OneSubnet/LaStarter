<?php

namespace App\Http\Api\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Base API Resource Class
 *
 * Provides standard resource transformation methods.
 * All API resources should extend this class.
 */
abstract class ApiResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->when($this->resource->exists, $this->resource->getKey()),
            ...$this->transform($request),
        ];
    }

    /**
     * Transform the resource into an array.
     *
     * Override this method in child classes to customize the transformation.
     *
     * @return array<string, mixed>
     */
    abstract protected function transform(Request $request): array;

    /**
     * Get additional data that should be returned with the resource array.
     *
     * @return array<string, mixed>
     */
    public function with(Request $request): array
    {
        return [
            'success' => true,
        ];
    }

    /**
     * Customize the response for a request.
     *
     * @return array<string, mixed>
     */
    public function toResponse($request)
    {
        return parent::toResponse($request);
    }
}
