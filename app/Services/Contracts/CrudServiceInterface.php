<?php

namespace App\Services\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\LaravelData\Data;

/**
 * CRUD Service Interface
 *
 * Defines the contract for CRUD services.
 */
interface CrudServiceInterface
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
     */
    public function all(array $relations = [], ?int $limit = null): Collection;

    /**
     * Get paginated results.
     */
    public function paginate(int $perPage = 15, array $relations = []): LengthAwarePaginator;

    /**
     * Create a new model.
     */
    public function create(array|Data $data): Model;

    /**
     * Update a model.
     */
    public function update(Model $model, array|Data $data): Model;

    /**
     * Delete a model.
     */
    public function delete(Model $model): bool;

    /**
     * Search models by term.
     */
    public function search(string $term, string $field = 'name', int $perPage = 15): LengthAwarePaginator;

    /**
     * Check if a model exists.
     */
    public function exists(int $id): bool;

    /**
     * Get count of models.
     */
    public function count(): int;
}
