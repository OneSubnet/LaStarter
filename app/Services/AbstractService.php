<?php

namespace App\Services;

use App\Repositories\Contracts\RepositoryInterface;
use App\Services\Contracts\ServiceInterface;
use Illuminate\Database\Eloquent\Model;

/**
 * Base Service Class
 *
 * Provides standard business logic operations.
 * Services orchestrate business rules using repositories.
 *
 * @template TModel of Model
 * @template TRepository of RepositoryInterface
 */
abstract class AbstractService implements ServiceInterface
{
    /** @var TRepository */
    protected RepositoryInterface $repository;

    /**
     * Create a new service instance.
     *
     * @param  TRepository  $repository
     */
    public function __construct(RepositoryInterface $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Get the repository instance.
     *
     * @return TRepository
     */
    public function getRepository(): RepositoryInterface
    {
        return $this->repository;
    }

    /**
     * {@inheritDoc}
     */
    public function find(int|string $id, array $relations = []): ?Model
    {
        return $this->repository->find($id, $relations);
    }

    /**
     * {@inheritDoc}
     */
    public function findOrFail(int|string $id, array $relations = []): Model
    {
        return $this->repository->findOrFail($id, $relations);
    }

    /**
     * {@inheritDoc}
     */
    public function all(array $relations = [], ?int $limit = null): array
    {
        return $this->repository->all($relations, $limit)->all();
    }

    /**
     * {@inheritDoc}
     */
    public function paginate(int $perPage = 15, array $relations = []): array
    {
        return $this->repository->paginate($perPage, $relations)->toArray();
    }

    /**
     * {@inheritDoc}
     */
    public function create(array $attributes): Model
    {
        return $this->repository->create($attributes);
    }

    /**
     * {@inheritDoc}
     */
    public function update(Model $model, array $attributes): bool
    {
        return $this->repository->update($model, $attributes);
    }

    /**
     * {@inheritDoc}
     */
    public function delete(Model $model): bool
    {
        return $this->repository->delete($model);
    }

    /**
     * Execute a callback within a transaction.
     *
     * @template TResult
     *
     * @param  \Closure(): TResult  $callback
     * @return TResult
     */
    protected function transaction(\Closure $callback): mixed
    {
        return $this->repository->transaction($callback);
    }
}
