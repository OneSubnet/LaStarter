<?php

namespace App\Services\Contracts;

use Illuminate\Database\Eloquent\Model;

/**
 * Service Interface
 *
 * Defines the contract for all services.
 * Services contain business logic and orchestrate operations.
 */
interface ServiceInterface
{
    /**
     * Find a model by its primary key.
     */
    public function find(int|string $id, array $relations = []): ?Model;

    /**
     * Find a model or throw an exception.
     */
    public function findOrFail(int|string $id, array $relations = []): Model;

    /**
     * Get all models.
     *
     * @return array<int, array<string, mixed>>
     */
    public function all(array $relations = [], ?int $limit = null): array;

    /**
     * Get paginated results.
     *
     * @return array<string, mixed>
     */
    public function paginate(int $perPage = 15, array $relations = []): array;

    /**
     * Create a new model.
     */
    public function create(array $attributes): Model;

    /**
     * Update a model.
     */
    public function update(Model $model, array $attributes): bool;

    /**
     * Delete a model.
     */
    public function delete(Model $model): bool;
}
