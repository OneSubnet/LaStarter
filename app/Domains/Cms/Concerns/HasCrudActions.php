<?php

namespace App\Domains\Cms\Concerns;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Has CRUD Actions Trait
 *
 * Provides standard CRUD action methods for controllers.
 * Use this trait in controllers that need basic CRUD operations.
 */
trait HasCrudActions
{
    /**
     * Get the model class for this controller.
     *
     * @return class-string<Model>
     */
    abstract protected function getModelClass(): string;

    /**
     * Get the redirect route after a successful action.
     */
    abstract protected function getRedirectRoute(string $action, ?Model $model = null): string;

    /**
     * Get the success message for an action.
     */
    protected function getSuccessMessage(string $action): string
    {
        return match ($action) {
            'store' => 'Resource created successfully.',
            'update' => 'Resource updated successfully.',
            'destroy' => 'Resource deleted successfully.',
            default => 'Operation completed successfully.',
        };
    }

    /**
     * Store a newly created resource.
     */
    protected function performStore(Request $request): RedirectResponse
    {
        $model = ($this->getModelClass())::create($request->validated());

        return to_route($this->getRedirectRoute('index'))
            ->with('success', $this->getSuccessMessage('store'));
    }

    /**
     * Update the specified resource.
     */
    protected function performUpdate(Request $request, Model $model): RedirectResponse
    {
        $model->update($request->validated());

        return to_route($this->getRedirectRoute('edit', $model))
            ->with('success', $this->getSuccessMessage('update'));
    }

    /**
     * Remove the specified resource.
     */
    protected function performDestroy(Model $model): RedirectResponse
    {
        $model->delete();

        return to_route($this->getRedirectRoute('index'))
            ->with('success', $this->getSuccessMessage('destroy'));
    }
}
