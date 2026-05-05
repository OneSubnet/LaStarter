<?php

namespace App\Domain\Cache;

use App\Repositories\Contracts\RepositoryInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;

/**
 * Cacheable Repository Decorator
 *
 * Adds caching functionality to any repository.
 * Uses the decorator pattern to wrap existing repositories.
 */
class CacheableRepository implements RepositoryInterface
{
    protected int $defaultTtl = 3600; // 1 hour

    protected string $keyPrefix = 'repo:';

    public function __construct(
        protected RepositoryInterface $repository,
        protected string $modelName,
    ) {}

    /**
     * {@inheritDoc}
     */
    public function find(int|string $id, array $relations = []): ?Model
    {
        $key = $this->key('find', $id, $relations);

        return Cache::remember($key, $this->defaultTtl, fn () => $this->repository->find($id, $relations));
    }

    /**
     * {@inheritDoc}
     */
    public function findOrFail(int|string $id, array $relations = []): Model
    {
        $key = $this->key('find', $id, $relations);

        return Cache::remember($key, $this->defaultTtl, fn () => $this->repository->findOrFail($id, $relations));
    }

    /**
     * {@inheritDoc}
     */
    public function all(array $relations = [], ?int $limit = null): Collection
    {
        $key = $this->key('all', $relations, $limit);

        return Cache::remember($key, $this->defaultTtl, fn () => $this->repository->all($relations, $limit));
    }

    /**
     * {@inheritDoc}
     */
    public function paginate(int $perPage = 15, array $relations = []): LengthAwarePaginator
    {
        // Don't cache pagination by default due to varying page numbers
        return $this->repository->paginate($perPage, $relations);
    }

    /**
     * {@inheritDoc}
     */
    public function create(array $attributes): Model
    {
        $model = $this->repository->create($attributes);

        $this->clearCache();

        return $model;
    }

    /**
     * {@inheritDoc}
     */
    public function update(Model $model, array $attributes): bool
    {
        $result = $this->repository->update($model, $attributes);

        $this->clearCache($model->getKey());

        return $result;
    }

    /**
     * {@inheritDoc}
     */
    public function delete(Model $model): bool
    {
        $result = $this->repository->delete($model);

        $this->clearCache($model->getKey());

        return $result;
    }

    /**
     * {@inheritDoc}
     */
    public function findBy(string $attribute, mixed $value, array $relations = []): ?Model
    {
        $key = $this->key('findBy', $attribute, $value, $relations);

        return Cache::remember($key, $this->defaultTtl, fn () => $this->repository->findBy($attribute, $value, $relations));
    }

    /**
     * {@inheritDoc}
     */
    public function findByOrFail(string $attribute, mixed $value, array $relations = []): Model
    {
        $key = $this->key('findBy', $attribute, $value, $relations);

        return Cache::remember($key, $this->defaultTtl, fn () => $this->repository->findByOrFail($attribute, $value, $relations));
    }

    /**
     * {@inheritDoc}
     */
    public function beginTransaction(): void
    {
        $this->repository->beginTransaction();
    }

    /**
     * {@inheritDoc}
     */
    public function commit(): void
    {
        $this->repository->commit();
        $this->clearCache();
    }

    /**
     * {@inheritDoc}
     */
    public function rollback(): void
    {
        $this->repository->rollback();
    }

    /**
     * {@inheritDoc}
     */
    public function transaction(\Closure $callback): mixed
    {
        return $this->repository->transaction(function () use ($callback) {
            $result = $callback();

            $this->clearCache();

            return $result;
        });
    }

    /**
     * {@inheritDoc}
     */
    public function slugExists(string $slug, ?int $excludeId = null): bool
    {
        // Don't cache existence checks
        return $this->repository->slugExists($slug, $excludeId);
    }

    /**
     * {@inheritDoc}
     */
    public function firstOrCreate(array $where, array $values = []): Model
    {
        $model = $this->repository->firstOrCreate($where, $values);

        $this->clearCache($model->getKey());

        return $model;
    }

    /**
     * {@inheritDoc}
     */
    public function updateOrCreate(array $where, array $values = []): Model
    {
        $model = $this->repository->updateOrCreate($where, $values);

        $this->clearCache($model->getKey());

        return $model;
    }

    /**
     * {@inheritDoc}
     */
    public function count(?Builder $query = null): int
    {
        // Don't cache counts
        return $this->repository->count($query);
    }

    /**
     * {@inheritDoc}
     */
    public function exists(?Builder $query = null): bool
    {
        // Don't cache existence checks
        return $this->repository->exists($query);
    }

    /**
     * Get a query builder (not cached).
     */
    public function query(): Builder
    {
        return $this->repository->query();
    }

    /**
     * Generate a cache key.
     */
    protected function key(string $method, mixed ...$parts): string
    {
        $partsString = json_encode($parts);

        return $this->keyPrefix.$this->modelName.':'.$method.':'.md5($partsString);
    }

    /**
     * Clear cache for a specific ID or all cache.
     */
    protected function clearCache(?int $id = null): void
    {
        if ($id !== null) {
            Cache::forget($this->key('find', $id, []));
            Cache::forget($this->key('find', $id));
        } else {
            Cache::forget($this->key('all'));
            Cache::forget($this->key('all', []));
        }
    }

    /**
     * Set the default TTL.
     */
    public function withTtl(int $seconds): self
    {
        $this->defaultTtl = $seconds;

        return $this;
    }

    /**
     * Get the underlying repository.
     */
    public function getRepository(): RepositoryInterface
    {
        return $this->repository;
    }
}
