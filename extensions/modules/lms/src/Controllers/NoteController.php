<?php

namespace Modules\Lms\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Modules\Lms\Models\Enrollment;
use Modules\Lms\Models\LessonNote;

class NoteController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        Gate::authorize('lms.courses.learn');
        $enrollment = Enrollment::where('user_id', $request->user()->id)
            ->where('team_id', $request->user()->currentTeam->id)
            ->where('course_id', $request->route('course'))
            ->firstOrFail();

        $note = LessonNote::where('enrollment_id', $enrollment->id)
            ->where('lesson_id', $request->route('lesson'))
            ->first();

        return response()->json(['content' => $note?->content ?? '']);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('lms.courses.learn');
        $enrollment = Enrollment::where('user_id', $request->user()->id)
            ->where('team_id', $request->user()->currentTeam->id)
            ->where('course_id', $request->route('course'))
            ->firstOrFail();

        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        $note = LessonNote::updateOrCreate(
            [
                'enrollment_id' => $enrollment->id,
                'lesson_id' => $request->route('lesson'),
            ],
            ['content' => $validated['content']],
        );

        return response()->json(['content' => $note->content]);
    }
}
