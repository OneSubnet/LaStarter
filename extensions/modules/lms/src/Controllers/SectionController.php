<?php

namespace Modules\Lms\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Modules\Lms\Models\Course;
use Modules\Lms\Models\CourseSection;

class SectionController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('lms.courses.update');
        $course = Course::findOrFail($request->route('course'));
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        try {
            $course->sections()->create([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'sort_order' => $course->sections()->count(),
            ]);
            Inertia::flash('toast', ['type' => 'success', 'message' => __('Section created')]);

            return back();
        } catch (\Throwable $e) {
            Log::error('Section creation failed: '.$e->getMessage());
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Error: ').$e->getMessage()]);

            return back();
        }
    }

    public function update(Request $request): RedirectResponse
    {
        Gate::authorize('lms.courses.update');
        $section = CourseSection::findOrFail($request->route('section'));
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_published' => 'boolean',
        ]);

        try {
            $section->update($validated);
            Inertia::flash('toast', ['type' => 'success', 'message' => __('Section updated')]);

            return back();
        } catch (\Throwable $e) {
            Log::error('Section update failed: '.$e->getMessage());
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Error: ').$e->getMessage()]);

            return back();
        }
    }

    public function reorder(Request $request): RedirectResponse
    {
        Gate::authorize('lms.courses.update');
        $course = Course::findOrFail($request->route('course'));
        $sectionIds = $request->validate([
            'section_ids' => 'required|array',
            'section_ids.*' => 'integer',
        ])['section_ids'];

        try {
            foreach ($sectionIds as $index => $id) {
                $course->sections()->where('id', $id)->update(['sort_order' => $index]);
            }
            Inertia::flash('toast', ['type' => 'success', 'message' => __('Sections reordered')]);

            return back();
        } catch (\Throwable $e) {
            Log::error('Section reorder failed: '.$e->getMessage());
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Error: ').$e->getMessage()]);

            return back();
        }
    }

    public function destroy(Request $request): RedirectResponse
    {
        Gate::authorize('lms.courses.delete');
        $section = CourseSection::findOrFail($request->route('section'));

        try {
            $section->delete();
            Inertia::flash('toast', ['type' => 'success', 'message' => __('Section deleted')]);

            return back();
        } catch (\Throwable $e) {
            Log::error('Section deletion failed: '.$e->getMessage());
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Error: ').$e->getMessage()]);

            return back();
        }
    }
}
