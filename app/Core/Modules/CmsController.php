<?php

namespace App\Core\Modules;

use App\Concerns\AfterPersist;
use App\Core\Context\AppContext;
use App\Domains\Cms\DataToModel;
use App\Domains\Cms\Event\ResourceCreatedEvent;
use App\Domains\Cms\Event\ResourceDeletedEvent;
use App\Domains\Cms\Event\ResourceUpdatedEvent;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\LaravelData\Data;

/**
 * Base controller for module CMS resources.
 *
 * Extends the core CmsController with team-scoping and module-specific features.
 * All module controllers should extend this class for standard CRUD operations.
 *
 * @template TModel of Model
 * @template TRowData of Data
 * @template TFormData of Data
 */
abstract class CmsController
{
    use AfterPersist;

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

    /**
     * Get the current team from context.
     */
    protected function currentTeam(): ?Team
    {
        return app(AppContext::class)->team();
    }

    /**
     * Get the current authenticated user.
     */
    protected function currentUser(): ?User
    {
        return app(AppContext::class)->user();
    }

    protected function cmsIndex(?Builder $query = null, array $extra = []): Response
    {
        $search = trim(request()->query('q', ''));
        $query = $query ?? ($this->model)::query();

        // Apply team scope if model uses HasTeam trait
        if (method_exists($this->model, 'bootHasTeam')) {
            $query = $query->with('team');
        }

        if (! empty($search)) {
            $query = $this->applySearch($search, $query);
        }

        return Inertia::render(sprintf('%s/Index', $this->componentPath), [
            'pagination' => ($this->rowData)::collect(
                $query->paginate(15)
            ),
            ...$extra,
        ]);
    }

    protected function cmsEdit(Model $model, array $extra = []): Response
    {
        assert($model instanceof $this->model);

        return Inertia::render(sprintf('%s/Edit', $this->componentPath), [
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
        return Inertia::render(sprintf('%s/Create', $this->componentPath), [
            'item' => new ($this->formData)(),
            ...$extra,
        ]);
    }

    protected function cmsStore(DataToModel $data): RedirectResponse
    {
        assert($data instanceof DataToModel);
        $model = new ($this->model)();

        // Auto-fill team_id if model uses HasTeam trait
        if (method_exists($model, 'bootHasTeam') && $this->currentTeam()) {
            $model->team_id = $this->currentTeam()->id;
        }

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

        return to_route(sprintf('%s.index', $this->route), [
            'current_team' => $this->currentTeam()?->slug,
        ])->with('success', $message ?? 'Le contenu a bien été supprimé');
    }

    protected function applySearch(string $search, Builder $query): Builder
    {
        return $query->whereLike($this->searchField, '%'.$search.'%');
    }

    private function redirectAfterSave(Model $model, string $message = 'Le contenu a bien été créé'): RedirectResponse
    {
        $teamSlug = $this->currentTeam()?->slug ?? request()->route('current_team');

        if (method_exists($this, 'edit')) {
            return to_route(sprintf('%s.edit', $this->route), [
                'current_team' => $teamSlug,
                $model,
            ])->with('success', $message);
        }

        return to_route(sprintf('%s.index', $this->route), [
            'current_team' => $teamSlug,
        ])->with('success', $message);
    }
}
