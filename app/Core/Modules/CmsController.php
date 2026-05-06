<?php

namespace App\Core\Modules;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\LaravelData\Data;

abstract class CmsController
{
    use ValidatesRequests;

    protected string $componentPath = '';

    /** @var class-string<Model> */
    protected string $model;

    /** @var class-string<Data> Data class with fromModel() for list rows */
    protected string $rowData = '';

    /** @var class-string<Data> Data class with fromModel() for form data */
    protected string $formData = '';

    /** @var class-string<Data> Data class with toModel() for request data */
    protected string $requestData = '';

    protected string $route = '';

    protected string $searchField = '';

    protected int $perPage = 15;

    /**
     * The route parameter name used for model binding.
     * Defaults to the singular form of the last route segment.
     * Override in controllers that use a different parameter name (e.g. 'product' for catalogue).
     */
    protected string $routeParam = '';

    // ──────────────────────────────────────────────
    // CMS convenience methods called by module controllers
    // ──────────────────────────────────────────────

    protected function cmsIndex(): Response
    {
        $query = $this->model::query();

        if (method_exists($this, 'indexQuery')) {
            $query = $this->indexQuery($query, request());
        }

        $search = request('search', '');

        if ($search !== '' && $this->searchField !== '') {
            $query->where($this->searchField, 'like', "%{$search}%");
        }

        $paginator = $query->paginate($this->perPage)->withQueryString();

        if ($this->rowData !== '') {
            $rowDataClass = $this->rowData;
            $paginator->through(fn ($item) => $rowDataClass::fromModel($item));
        }

        return Inertia::render("{$this->componentPath}/Index", [
            'items' => $paginator,
        ]);
    }

    protected function cmsCreate(): Response
    {
        return Inertia::render("{$this->componentPath}/Create");
    }

    protected function cmsStore(object $data): RedirectResponse
    {
        $model = new $this->model;

        if (method_exists($data, 'toModel')) {
            $data->toModel($model);
        }

        $model->save();

        return Redirect::route("{$this->route}.show", [
            'current_team' => $this->teamSlug(),
            $this->resolveParam() => $model->id,
        ])->with('toast', ['type' => 'success', 'message' => __('Created successfully.')]);
    }

    protected function cmsShow(Model $model): Response
    {
        $props = ['item' => $model];

        if ($this->rowData !== '' && method_exists($this->rowData, 'fromModel')) {
            $rowDataClass = $this->rowData;
            $props['item'] = $rowDataClass::fromModel($model);
        }

        return Inertia::render("{$this->componentPath}/Show", $props);
    }

    public function show(Request $request): Response
    {
        $id = $this->resolveModelId($request);

        return $this->cmsShow($this->model::findOrFail($id));
    }

    protected function cmsEdit(Model $model): Response
    {
        $item = $model;

        if ($this->formData !== '' && method_exists($this->formData, 'fromModel')) {
            $formDataClass = $this->formData;
            $item = $formDataClass::fromModel($model);
        }

        return Inertia::render("{$this->componentPath}/Edit", [
            'item' => $item,
        ]);
    }

    protected function cmsUpdate(Model $model, object $data): RedirectResponse
    {
        if (method_exists($data, 'toModel')) {
            $data->toModel($model);
        }

        $model->save();

        return Redirect::route("{$this->route}.show", [
            'current_team' => $this->teamSlug(),
            $this->resolveParam() => $model->id,
        ])->with('toast', ['type' => 'success', 'message' => __('Updated successfully.')]);
    }

    protected function cmsDestroy(Model $model, string $message = ''): RedirectResponse
    {
        $model->delete();

        return back()->with('toast', [
            'type' => 'success',
            'message' => $message ?: __('Deleted successfully.'),
        ]);
    }

    protected function teamSlug(): string
    {
        $team = request()->route('current_team');

        return $team instanceof Model ? $team->getRouteKey() : (string) $team;
    }

    protected function resolveParam(): string
    {
        if ($this->routeParam !== '') {
            return $this->routeParam;
        }

        $segments = explode('.', $this->route);

        return Str::singular(end($segments));
    }

    private function resolveModelId(Request $request): mixed
    {
        $param = $this->resolveParam();
        $value = $request->route($param);

        if ($value instanceof Model) {
            return $value->getKey();
        }

        return $value;
    }
}
