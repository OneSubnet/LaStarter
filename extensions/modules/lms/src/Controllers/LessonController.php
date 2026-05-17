<?php

namespace Modules\Lms\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Modules\Lms\Models\CourseSection;
use Modules\Lms\Models\Lesson;

class LessonController extends Controller
{
    public function edit(Request $request): InertiaResponse
    {
        Gate::authorize('lms.courses.view');
        $lesson = Lesson::findOrFail($request->route('lesson'));
        $lesson->load('section.course', 'questions.answers');

        return Inertia::render('lms/lessons/Edit', [
            'lesson' => [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'content_type' => $lesson->content_type,
                'content' => $lesson->content,
                'video_url' => $lesson->video_url,
                'video_duration_seconds' => $lesson->video_duration_seconds,
                'sort_order' => $lesson->sort_order,
                'is_published' => $lesson->is_published,
            ],
            'course' => [
                'id' => $lesson->section->course->id,
                'title' => $lesson->section->course->title,
            ],
            'section' => [
                'id' => $lesson->section->id,
                'title' => $lesson->section->title,
            ],
            'questions' => $lesson->questions->map(fn ($q) => [
                'id' => $q->id,
                'question_text' => $q->question_text,
                'explanation' => $q->explanation,
                'sort_order' => $q->sort_order,
                'answers' => $q->answers->map(fn ($a) => [
                    'id' => $a->id,
                    'answer_text' => $a->answer_text,
                    'is_correct' => $a->is_correct,
                    'sort_order' => $a->sort_order,
                ]),
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('lms.courses.update');
        $section = CourseSection::findOrFail($request->route('section'));
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content_type' => 'string|in:text,video,quiz',
            'content' => 'nullable|string',
            'video_url' => 'nullable|string',
            'video_duration_seconds' => 'nullable|integer',
        ]);

        try {
            $section->lessons()->create([
                ...$validated,
                'sort_order' => $section->lessons()->count(),
            ]);
            Inertia::flash('toast', ['type' => 'success', 'message' => __('Lesson created')]);

            return back();
        } catch (\Throwable $e) {
            Log::error('Lesson creation failed: '.$e->getMessage());
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Error: ').$e->getMessage()]);

            return back();
        }
    }

    public function update(Request $request): RedirectResponse
    {
        Gate::authorize('lms.courses.update');
        $lesson = Lesson::findOrFail($request->route('lesson'));
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content_type' => 'string|in:text,video,quiz',
            'content' => 'nullable|string',
            'video_url' => 'nullable|string',
            'video_duration_seconds' => 'nullable|integer',
            'is_published' => 'boolean',
        ]);

        try {
            $lesson->update($validated);
            Inertia::flash('toast', ['type' => 'success', 'message' => __('Lesson updated')]);

            return back();
        } catch (\Throwable $e) {
            Log::error('Lesson update failed: '.$e->getMessage());
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Error: ').$e->getMessage()]);

            return back();
        }
    }

    public function reorder(Request $request): RedirectResponse
    {
        Gate::authorize('lms.courses.update');
        $section = CourseSection::findOrFail($request->route('section'));
        $lessonIds = $request->validate([
            'lesson_ids' => 'required|array',
            'lesson_ids.*' => 'integer',
        ])['lesson_ids'];

        try {
            foreach ($lessonIds as $index => $id) {
                $section->lessons()->where('id', $id)->update(['sort_order' => $index]);
            }
            Inertia::flash('toast', ['type' => 'success', 'message' => __('Lesson updated')]);

            return back();
        } catch (\Throwable $e) {
            Log::error('Lesson reorder failed: '.$e->getMessage());
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Error: ').$e->getMessage()]);

            return back();
        }
    }

    public function destroy(Request $request): RedirectResponse
    {
        Gate::authorize('lms.courses.delete');
        $lesson = Lesson::findOrFail($request->route('lesson'));

        try {
            $lesson->delete();
            Inertia::flash('toast', ['type' => 'success', 'message' => __('Lesson deleted')]);

            return back();
        } catch (\Throwable $e) {
            Log::error('Lesson deletion failed: '.$e->getMessage());
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Error: ').$e->getMessage()]);

            return back();
        }
    }
}
