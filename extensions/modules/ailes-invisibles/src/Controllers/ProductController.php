<?php

namespace Modules\AilesInvisibles\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Modules\AilesInvisibles\Http\Requests\StoreProductRequest;
use Modules\AilesInvisibles\Models\Product;
use Modules\AilesInvisibles\Services\NextcloudStorageService;

class ProductController
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Product::class);

        $products = Product::query()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'description' => $product->description,
                'image_url' => $product->image_path ? (
                    str_starts_with($product->image_path, 'nextcloud:')
                        ? null // Nextcloud images served via download route
                        : Storage::url($product->image_path)
                ) : null,
                'type' => $product->type,
                'price' => (float) $product->price,
                'tax_rate' => (float) $product->tax_rate,
                'unit' => $product->unit,
                'category' => $product->category,
                'sku' => $product->sku,
                'reference' => $product->reference,
                'stock' => $product->stock,
                'stock_alert' => $product->stock_alert,
                'is_active' => $product->is_active,
                'created_at' => $product->created_at->toISOString(),
            ]);

        return Inertia::render('ailes-invisibles/admin/catalog/Index', [
            'products' => $products,
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        Gate::authorize('create', Product::class);

        $data = $request->validated();

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $nextcloud = app(NextcloudStorageService::class);
            $teamSlug = $request->user()->currentTeam?->slug ?? 'default';

            if ($nextcloud->isConfigured()) {
                $content = file_get_contents($file->getRealPath());
                $remotePath = $nextcloud->upload(
                    'products/'.uniqid().'_'.$file->getClientOriginalName(),
                    $content,
                    $teamSlug
                );
                $data['image_path'] = 'nextcloud:'.$remotePath;
            } else {
                $data['image_path'] = $file->store('products', 'public');
            }
        }

        Product::create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Product created.')]);

        return to_route('ai.products.index', [
            'current_team' => $request->user()->currentTeam->slug,
        ]);
    }

    public function update(StoreProductRequest $request): RedirectResponse
    {
        $product = Product::findOrFail($request->route('product'));

        Gate::authorize('update', $product);

        $data = $request->validated();

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $nextcloud = app(NextcloudStorageService::class);
            $teamSlug = $request->user()->currentTeam?->slug ?? 'default';

            // Delete old image
            if ($product->image_path) {
                if (str_starts_with($product->image_path, 'nextcloud:')) {
                    $nextcloud->delete(substr($product->image_path, strlen('nextcloud:')));
                } else {
                    Storage::disk('public')->delete($product->image_path);
                }
            }

            if ($nextcloud->isConfigured()) {
                $content = file_get_contents($file->getRealPath());
                $remotePath = $nextcloud->upload(
                    'products/'.uniqid().'_'.$file->getClientOriginalName(),
                    $content,
                    $teamSlug
                );
                $data['image_path'] = 'nextcloud:'.$remotePath;
            } else {
                $data['image_path'] = $file->store('products', 'public');
            }
        }

        $product->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Product updated.')]);

        return to_route('ai.products.index', [
            'current_team' => $request->user()->currentTeam->slug,
        ]);
    }

    public function destroy(Request $request): RedirectResponse
    {
        $product = Product::findOrFail($request->route('product'));

        Gate::authorize('delete', $product);

        if ($product->image_path) {
            if (str_starts_with($product->image_path, 'nextcloud:')) {
                app(NextcloudStorageService::class)
                    ->delete(substr($product->image_path, strlen('nextcloud:')));
            } else {
                Storage::disk('public')->delete($product->image_path);
            }
        }

        $product->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Product deleted.')]);

        return to_route('ai.products.index', [
            'current_team' => $request->user()->currentTeam->slug,
        ]);
    }
}
