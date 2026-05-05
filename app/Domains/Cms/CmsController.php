<?php

namespace App\Domains\Cms;

use App\Domains\Cms\Event\ResourceCreatedEvent;
use App\Domains\Cms\Event\ResourceDeletedEvent;
use App\Domains\Cms\Event\ResourceUpdatedEvent;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\LaravelData\Data;

/**
 * Base controller for CMS resources.
 *
 * Provides standard CRUD methods for managing content.
 * Child controllers must define configuration properties
 * and can override methods to customize behavior.
 *
 * @template TModel of Model
 * @template TRowData of Data
 * @template TFormData of Data
 */
abstract class CmsController
{
    protected string $componentPath = '';

    /** @var class-string<TModel> */
    protected string $model = '';

    /** @var class-string<TRowData> */
    protected string $rowData = '';

    /** @var class-string<TFormData> */
    protected string $formData = '';

    /** @var class-string<Data&DataToModel> */
    protected string $requestData = '';

    protected string $route = '';

    protected string $searchField = 'title';

    /** @var array{update: class-string, store: class-string, destroy: class-string} */
    protected array $events = [
        'update' => ResourceUpdatedEvent::class,
        'store' => ResourceCreatedEvent::class,
        'destroy' => ResourceDeletedEvent::class,
    ];

    protected function cmsIndex(?Builder $query = null, array $extra = []): Response
    {
        $search = trim(request()->query('q', ''));
        $query = $query ?? ($this->model)::query();
        if (! empty($search)) {
            $query = $this->applySearch($search, $query);
        }

        return Inertia::render(sprintf('%s/index', $this->componentPath), [
            'pagination' => ($this->rowData)::collect(
                $query->paginate(15)
            ),
            ...$extra,
        ]);
    }

    protected function cmsEdit(Model $model, array $extra = []): Response
    {
        assert($model instanceof $this->model);

        return Inertia::render(sprintf('%s/form', $this->componentPath), [
            'item' => ($this->formData)::from($model),
            ...$extra,
        ]);
    }

    protected function cmsUpdate(Model $model, DataToModel $data): RedirectResponse
    {
        assert($model instanceof $this->model);
        assert($data instanceof $this->requestData);
        $data->toModel($model);
        $model->save();
        event(new ($this->events['update'])($model));

        return $this->redirectAfterSave($model, 'Le contenu a bien été modifié');
    }

    protected function cmsCreate(array $extra = []): Response
    {
        return Inertia::render(sprintf('%s/form', $this->componentPath), [
            'item' => new ($this->formData)(),
            ...$extra,
        ]);
    }

    protected function cmsStore(DataToModel $data): RedirectResponse
    {
        assert($data instanceof DataToModel);
        $model = new ($this->model)();
        $data->toModel($model);
        $model->save();
        event(new ($this->events['store'])($model));

        return $this->redirectAfterSave($model);
    }

    protected function cmsDestroy(Model $model, ?string $message = null): RedirectResponse
    {
        assert($model instanceof $this->model);
        $model->delete();
        event(new ($this->events['destroy'])($model));

        return to_route(sprintf('cms.%s.index', $this->route))
            ->with('success', $message ?? 'Le contenu a bien été supprimé');
    }

    protected function applySearch(string $search, Builder $query): Builder
    {
        return $query->whereLike($this->searchField, '%'.$search.'%');
    }

    private function redirectAfterSave(Model $model, string $message = 'Le contenu a bien été créé'): RedirectResponse
    {
        if (method_exists($this, 'edit')) {
            return to_route(sprintf('cms.%s.edit', $this->route), [$model])
                ->with('success', $message);
        }

        return to_route(sprintf('cms.%s.index', $this->route))
            ->with('success', $message);
    }
}
