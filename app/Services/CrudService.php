<?php

namespace App\Services;

use App\Domains\Cms\DataToModel;
use App\Repositories\AbstractRepository;
use App\Repositories\Contracts\RepositoryInterface;
use App\Services\Contracts\CrudServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\LaravelData\Data;

/**
 * Generic CRUD Service
 *
 * Provides automatic CRUD operations for simple domains.
 * Extend this service and define the model and request data class.
 *
 * @template TModel of Model
 * @template TRequestData of Data&DataToModel
 */
abstract class CrudService implements CrudServiceInterface
{
    /** @var class-string<TModel> */
    protected string $model;

    /** @var class-string<TRequestData> */
    protected string $requestDataType;

    protected RepositoryInterface $repository;

    /**
     * Create a new service instance.
     */
    public function __construct()
    {
        $this->repository = $this->createRepository();
    }

    /**
     * Create the repository instance.
     */
    protected function createRepository(): RepositoryInterface
    {
        $repositoryClass = $this->getRepositoryClass();

        return new $repositoryClass(new $this->model);
    }

    /**
     * Get the repository class for this service.
     *
     * @return class-string<RepositoryInterface>
     */
    protected function getRepositoryClass(): string
    {
        return AbstractRepository::class;
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
    public function all(array $relations = [], ?int $limit = null): Collection
    {
        return $this->repository->all($relations, $limit);
    }

    /**
     * {@inheritDoc}
     */
    public function paginate(int $perPage = 15, array $relations = []): LengthAwarePaginator
    {
        return $this->repository->paginate($perPage, $relations);
    }

    /**
     * {@inheritDoc}
     */
    public function create(array|Data $data): Model
    {
        $dto = $this->toDto($data);
        $model = new $this->model;

        if ($dto instanceof DataToModel) {
            $dto->toModel($model);
            $model->save();

            return $model;
        }

        return $this->repository->create($dto->toArray());
    }

    /**
     * {@inheritDoc}
     */
    public function update(Model $model, array|Data $data): Model
    {
        $dto = $this->toDto($data);

        if ($dto instanceof DataToModel) {
            $dto->toModel($model);
            $model->save();

            return $model->fresh();
        }

        $this->repository->update($model, $dto->toArray());

        return $model->fresh();
    }

    /**
     * {@inheritDoc}
     */
    public function delete(Model $model): bool
    {
        return $this->repository->delete($model);
    }

    /**
     * {@inheritDoc}
     */
    public function search(string $term, string $field = 'name', int $perPage = 15): LengthAwarePaginator
    {
        return $this->repository->query()
            ->where($field, 'like', '%'.$term.'%')
            ->paginate($perPage);
    }

    /**
     * {@inheritDoc}
     */
    public function exists(int $id): bool
    {
        return $this->repository->query()->whereKey($id)->exists();
    }

    /**
     * {@inheritDoc}
     */
    public function count(): int
    {
        return $this->repository->query()->count();
    }

    /**
     * Convert array or Data to DTO.
     */
    protected function toDto(array|Data $data): Data
    {
        if (is_array($data)) {
            return $this->requestDataType::from($data);
        }

        return $data;
    }

    /**
     * Get the repository instance.
     */
    public function getRepository(): RepositoryInterface
    {
        return $this->repository;
    }

    /**
     * Get a new query builder.
     */
    public function query()
    {
        return $this->repository->query();
    }
}
