<?php

namespace Modules\Lms\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Modules\Lms\Models\CommentReaction;
use Modules\Lms\Models\LessonComment;

class CommentController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('lms.courses.learn');
        $validated = $request->validate([
            'lesson_id' => 'required|integer|exists:lms_lessons,id',
            'parent_id' => 'nullable|integer|exists:lms_lesson_comments,id',
            'content' => 'required|string|max:2000',
        ]);

        try {
            LessonComment::create([
                'lesson_id' => $validated['lesson_id'],
                'user_id' => $request->user()->id,
                'parent_id' => $validated['parent_id'] ?? null,
                'content' => $validated['content'],
            ]);

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Comment posted')]);
        } catch (\Throwable $e) {
            Log::error('Comment creation failed: '.$e->getMessage());
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Error: ').$e->getMessage()]);
        }

        return back();
    }

    public function update(Request $request): RedirectResponse
    {
        Gate::authorize('lms.courses.learn');
        $comment = LessonComment::findOrFail($request->route('comment'));

        if ($comment->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'content' => 'required|string|max:2000',
        ]);

        $comment->update(['content' => $validated['content']]);
        Inertia::flash('toast', ['type' => 'success', 'message' => __('Comment updated')]);

        return back();
    }

    public function destroy(Request $request): RedirectResponse
    {
        Gate::authorize('lms.courses.learn');
        $comment = LessonComment::findOrFail($request->route('comment'));

        if ($comment->user_id !== $request->user()->id) {
            abort(403);
        }

        $comment->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => __('Comment deleted')]);

        return back();
    }

    public function toggleReaction(Request $request): RedirectResponse
    {
        Gate::authorize('lms.courses.learn');
        $validated = $request->validate([
            'emoji' => 'required|string|max:10',
        ]);

        $comment = LessonComment::findOrFail($request->route('comment'));

        $existing = CommentReaction::where([
            'comment_id' => $comment->id,
            'user_id' => $request->user()->id,
            'emoji' => $validated['emoji'],
        ])->first();

        if ($existing) {
            $existing->delete();
        } else {
            CommentReaction::create([
                'comment_id' => $comment->id,
                'user_id' => $request->user()->id,
                'emoji' => $validated['emoji'],
            ]);
        }

        return back();
    }
}
