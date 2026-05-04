<?php

namespace App\Repositories\Contracts;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Repository Interface
 *
 * Defines the contract for all repositories.
 * Provides standard CRUD operations and query building.
 */
interface RepositoryInterface
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
     * @return Collection<int, Model>
     */
    public function all(array $relations = [], ?int $limit = null): Collection;

    /**
     * Get paginated results.
     */
    public function paginate(int $perPage = 15, array $relations = []): LengthAwarePaginator;

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

    /**
     * Find a model by a specific attribute.
     */
    public function findBy(string $attribute, mixed $value, array $relations = []): ?Model;

    /**
     * Find a model by attributes or throw an exception.
     */
    public function findByOrFail(string $attribute, mixed $value, array $relations = []): Model;

    /**
     * Get a query builder instance.
     */
    public function query(): Builder;

    /**
     * Begin a new database transaction.
     */
    public function beginTransaction(): void;

    /**
     * Commit the database transaction.
     */
    public function commit(): void;

    /**
     * Rollback the database transaction.
     */
    public function rollback(): void;

    /**
     * Execute a callback within a transaction.
     *
     * @template T
     *
     * @param  \Closure(): T  $callback
     * @return T
     */
    public function transaction(\Closure $callback): mixed;
}
