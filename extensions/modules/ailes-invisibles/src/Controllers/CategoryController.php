<?php

namespace Modules\AilesInvisibles\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Modules\AilesInvisibles\Models\Category;

class CategoryController
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Category::class);

        $categories = Category::query()
            ->withCount('products')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'description' => $category->description,
                'sort_order' => $category->sort_order,
                'is_active' => $category->is_active,
                'products_count' => $category->products_count,
            ]);

        return Inertia::render('ailes-invisibles/admin/categories/Index', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('create', Category::class);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        Category::create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Category created.')]);

        return to_route('ai.categories.index', [
            'current_team' => $request->user()->currentTeam->slug,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $category = Category::findOrFail($request->route('category'));

        Gate::authorize('update', $category);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        $category->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Category updated.')]);

        return to_route('ai.categories.index', [
            'current_team' => $request->user()->currentTeam->slug,
        ]);
    }

    public function destroy(Request $request): RedirectResponse
    {
        $category = Category::findOrFail($request->route('category'));

        Gate::authorize('delete', $category);

        $category->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Category deleted.')]);

        return to_route('ai.categories.index', [
            'current_team' => $request->user()->currentTeam->slug,
        ]);
    }
}
