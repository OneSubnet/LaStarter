<?php

namespace App\Repositories;

use App\Repositories\Contracts\RepositoryInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

/**
 * Abstract Repository
 *
 * Base repository class with standard CRUD operations.
 * All concrete repositories should extend this class.
 */
abstract class AbstractRepository implements RepositoryInterface
{
    /**
     * The model instance.
     */
    protected Model $model;

    /**
     * Create a new repository instance.
     */
    public function __construct(Model $model)
    {
        $this->model = $model;
    }

    /**
     * Get a new query builder instance.
     */
    public function query(): Builder
    {
        return $this->model->newQuery();
    }

    /**
     * {@inheritDoc}
     */
    public function find(int|string $id, array $relations = []): ?Model
    {
        return $this->query()->with($relations)->find($id);
    }

    /**
     * {@inheritDoc}
     */
    public function findOrFail(int|string $id, array $relations = []): Model
    {
        return $this->query()->with($relations)->findOrFail($id);
    }

    /**
     * {@inheritDoc}
     */
    public function all(array $relations = [], ?int $limit = null): Collection
    {
        $query = $this->query()->with($relations);

        if ($limit !== null) {
            return $query->limit($limit)->get();
        }

        return $query->get();
    }

    /**
     * {@inheritDoc}
     */
    public function paginate(int $perPage = 15, array $relations = []): LengthAwarePaginator
    {
        return $this->query()->with($relations)->paginate($perPage);
    }

    /**
     * {@inheritDoc}
     */
    public function create(array $attributes): Model
    {
        return $this->model->create($attributes);
    }

    /**
     * {@inheritDoc}
     */
    public function update(Model $model, array $attributes): bool
    {
        return $model->update($attributes);
    }

    /**
     * {@inheritDoc}
     */
    public function delete(Model $model): bool
    {
        return $model->delete();
    }

    /**
     * Save an existing model instance.
     */
    public function save(Model $model): bool
    {
        return $model->save();
    }

    /**
     * {@inheritDoc}
     */
    public function findBy(string $attribute, mixed $value, array $relations = []): ?Model
    {
        return $this->query()->with($relations)->where($attribute, $value)->first();
    }

    /**
     * {@inheritDoc}
     */
    public function findByOrFail(string $attribute, mixed $value, array $relations = []): Model
    {
        return $this->query()->with($relations)->where($attribute, $value)->firstOrFail();
    }

    /**
     * {@inheritDoc}
     */
    public function beginTransaction(): void
    {
        DB::beginTransaction();
    }

    /**
     * {@inheritDoc}
     */
    public function commit(): void
    {
        DB::commit();
    }

    /**
     * {@inheritDoc}
     */
    public function rollback(): void
    {
        DB::rollBack();
    }

    /**
     * {@inheritDoc}
     */
    public function transaction(\Closure $callback): mixed
    {
        return DB::transaction($callback);
    }

    /**
     * Get the model instance.
     */
    protected function getModel(): Model
    {
        return $this->model;
    }

    /**
     * Set the model instance.
     */
    protected function setModel(Model $model): void
    {
        $this->model = $model;
    }

    /**
     * Check if a slug exists for the model.
     */
    public function slugExists(string $slug, ?int $excludeId = null): bool
    {
        return $this->query()
            ->where('slug', $slug)
            ->when($excludeId, fn (Builder $q) => $q->where('id', '!=', $excludeId))
            ->exists();
    }

    /**
     * Get first model by column value or create it.
     *
     * @param  array<string, mixed>  $where
     * @param  array<string, mixed>  $values
     */
    public function firstOrCreate(array $where, array $values = []): Model
    {
        return $this->query()->firstOrCreate($where, $values);
    }

    /**
     * Update or create a model.
     *
     * @param  array<string, mixed>  $where
     * @param  array<string, mixed>  $values
     */
    public function updateOrCreate(array $where, array $values = []): Model
    {
        return $this->query()->updateOrCreate($where, $values);
    }

    /**
     * Get count of models matching the query.
     */
    public function count(?Builder $query = null): int
    {
        return ($query ?? $this->query())->count();
    }

    /**
     * Check if any models exist.
     */
    public function exists(?Builder $query = null): bool
    {
        return ($query ?? $this->query())->exists();
    }
}
