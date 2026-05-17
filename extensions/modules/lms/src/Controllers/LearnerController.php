<?php

namespace Modules\Lms\Controllers;

use App\Core\Modules\CmsController;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Modules\Lms\Data\Learner\LearnerRowData;
use Modules\Lms\Models\Enrollment;
use Modules\Lms\Models\LessonProgress;
use Modules\Lms\Models\QuizResponse;

class LearnerController extends CmsController
{
    protected string $componentPath = 'lms/learners';

    protected string $searchField = 'name';

    protected string $route = 'lms.learners';

    public function index(Request $request): InertiaResponse
    {
        $teamId = $request->user()->currentTeam->id;
        $search = $request->get('search', '');

        $learnersQuery = User::whereHas('teams', fn ($q) => $q->where('teams.id', $teamId))
            ->whereHas('permissions', fn ($q) => $q->where('name', 'lms.courses.learn'))
            ->when($search !== '', fn ($q) => $q->where('name', 'like', "%{$search}%"))
            ->orderBy('name');

        $learners = $learnersQuery->paginate(15)->withQueryString();

        $enrollmentCounts = Enrollment::where('team_id', $teamId)
            ->whereIn('user_id', $learners->pluck('id'))
            ->selectRaw('user_id, count(*) as count')
            ->groupBy('user_id')
            ->pluck('count', 'user_id');

        $learners->through(fn ($user) => LearnerRowData::fromModel(
            $user,
            $enrollmentCounts->get($user->id, 0),
        ));

        return Inertia::render("{$this->componentPath}/Index", [
            'items' => $learners,
        ]);
    }

    public function show(Request $request): InertiaResponse
    {
        $learner = User::findOrFail($request->route('learner'));
        $teamId = $request->user()->currentTeam->id;

        $enrollments = Enrollment::where('team_id', $teamId)
            ->where('user_id', $learner->id)
            ->with(['course.sections.lessons'])
            ->get();

        $enrollmentIds = $enrollments->pluck('id');

        $progressMap = LessonProgress::whereIn('enrollment_id', $enrollmentIds)
            ->get()
            ->groupBy('enrollment_id');

        $courses = $enrollments->map(function (Enrollment $enrollment) use ($progressMap) {
            $course = $enrollment->course;
            $lessonProgresses = $progressMap->get($enrollment->id, collect());

            return [
                'enrollment_id' => $enrollment->id,
                'course_id' => $course->id,
                'course_title' => $course->title,
                'course_status' => $course->status,
                'is_blocked' => $enrollment->isBlocked(),
                'enrolled_at' => $enrollment->enrolled_at?->toIso8601String(),
                'completed_at' => $enrollment->completed_at?->toIso8601String(),
                'progress' => $enrollment->progress,
                'sections' => $course->sections->map(function ($section) use ($lessonProgresses) {
                    return [
                        'id' => $section->id,
                        'title' => $section->title,
                        'sort_order' => $section->sort_order,
                        'lessons' => $section->lessons->map(function ($lesson) use ($lessonProgresses) {
                            $lp = $lessonProgresses->firstWhere('lesson_id', $lesson->id);

                            return [
                                'id' => $lesson->id,
                                'title' => $lesson->title,
                                'content_type' => $lesson->content_type,
                                'sort_order' => $lesson->sort_order,
                                'is_published' => $lesson->is_published,
                                'status' => $lp?->status ?? 'not_started',
                                'progress' => $lp?->percentage() ?? 0,
                                'completed_at' => $lp?->completed_at?->toIso8601String(),
                            ];
                        })->values()->all(),
                    ];
                })->values()->all(),
            ];
        })->values()->all();

        // Quiz responses grouped by enrollment
        $quizResponses = QuizResponse::whereIn('enrollment_id', $enrollmentIds)
            ->with(['question:id,question_text', 'answer:id,answer_text,is_correct'])
            ->get()
            ->groupBy('enrollment_id')
            ->map(fn ($responses) => $responses->map(fn ($r) => [
                'question_id' => $r->question_id,
                'question_text' => $r->question?->question_text,
                'answer_id' => $r->answer_id,
                'answer_text' => $r->answer?->answer_text,
                'is_correct' => $r->is_correct,
            ])->values()->all());

        return Inertia::render("{$this->componentPath}/Show", [
            'learner' => [
                'id' => $learner->id,
                'name' => $learner->name,
                'email' => $learner->email,
            ],
            'courses' => $courses,
            'quizResponses' => $quizResponses,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'password' => 'nullable|string|min:8',
        ]);

        try {
            $team = $request->user()->currentTeam;

            $existingUser = User::where('email', $validated['email'])->first();

            if ($existingUser) {
                if ($existingUser->teams()->where('team_id', $team->id)->exists()) {
                    Inertia::flash('toast', [
                        'type' => 'error',
                        'message' => __('Already a team member'),
                    ]);

                    return redirect()->back()->withInput();
                }

                $existingUser->teams()->attach($team->id, [
                    'role' => 'member',
                    'status' => 'active',
                    'joined_at' => now(),
                ]);

                $existingUser->givePermissionTo(['lms.view', 'lms.courses.learn']);

                Inertia::flash('toast', ['type' => 'success', 'message' => __('Learner added')]);

                return redirect()->back();
            }

            $newUser = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password'] ?? str()->password(16)),
                'locale' => $team->locale ?? config('app.locale', 'fr'),
            ]);

            $newUser->teams()->attach($team->id, [
                'role' => 'member',
                'status' => 'active',
                'joined_at' => now(),
            ]);

            $newUser->givePermissionTo(['lms.view', 'lms.courses.learn']);

            // Send password reset link so the learner can set their own password
            Password::sendResetLink(['email' => $newUser->email]);

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Learner created')]);

            return redirect()->back();
        } catch (\Throwable $e) {
            Log::error('Learner creation failed: '.$e->getMessage(), ['exception' => $e]);
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Error: ').$e->getMessage()]);

            return redirect()->back()->withInput();
        }
    }

    public function update(Request $request): RedirectResponse
    {
        $learner = User::findOrFail($request->route('learner'));
        $teamId = $request->user()->currentTeam->id;

        $learner->teams()->where('teams.id', $teamId)->firstOrFail();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'password' => 'nullable|string|min:8',
        ]);

        try {
            $learner->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
            ]);

            if (! empty($validated['password'])) {
                $learner->update(['password' => Hash::make($validated['password'])]);
            }

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Learner updated')]);

            return back();
        } catch (\Throwable $e) {
            Log::error('Learner update failed: '.$e->getMessage());
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Error: ').$e->getMessage()]);

            return back();
        }
    }

    public function sendResetLink(Request $request): RedirectResponse
    {
        $learner = User::findOrFail($request->route('learner'));
        $teamId = $request->user()->currentTeam->id;

        $learner->teams()->where('teams.id', $teamId)->firstOrFail();

        try {
            $status = Password::sendResetLink(['email' => $learner->email]);

            if ($status === Password::RESET_LINK_SENT) {
                Inertia::flash('toast', ['type' => 'success', 'message' => __('Reset link sent')]);
            } else {
                Inertia::flash('toast', ['type' => 'error', 'message' => __('Failed to send reset link')]);
            }

            return back();
        } catch (\Throwable $e) {
            Log::error('Reset link failed: '.$e->getMessage());
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Error: ').$e->getMessage()]);

            return back();
        }
    }

    public function destroy(Request $request): RedirectResponse
    {
        $learner = User::findOrFail($request->route('learner'));
        $team = $request->user()->currentTeam;

        $learner->teams()->where('teams.id', $team->id)->firstOrFail();

        try {
            Enrollment::where('team_id', $team->id)
                ->where('user_id', $learner->id)
                ->delete();

            $learner->teams()->detach($team->id);

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Learner deleted')]);

            return back();
        } catch (\Throwable $e) {
            Log::error('Learner deletion failed: '.$e->getMessage());
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Error: ').$e->getMessage()]);

            return back();
        }
    }

    public function block(Request $request): RedirectResponse
    {
        $learner = User::findOrFail($request->route('learner'));
        $teamId = $request->user()->currentTeam->id;

        $learner->teams()->where('teams.id', $teamId)->firstOrFail();

        Enrollment::where('team_id', $teamId)
            ->where('user_id', $learner->id)
            ->update(['status' => 'blocked']);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Learner blocked')]);

        return back();
    }

    public function unblock(Request $request): RedirectResponse
    {
        $learner = User::findOrFail($request->route('learner'));
        $teamId = $request->user()->currentTeam->id;

        $learner->teams()->where('teams.id', $teamId)->firstOrFail();

        Enrollment::where('team_id', $teamId)
            ->where('user_id', $learner->id)
            ->update(['status' => 'active']);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Learner unblocked')]);

        return back();
    }

    public function search(Request $request)
    {
        $teamId = $request->user()->currentTeam->id;
        $search = $request->get('q', '');

        $users = User::whereHas('teams', fn ($q) => $q->where('teams.id', $teamId))
            ->whereHas('permissions', fn ($q) => $q->where('name', 'lms.courses.learn'))
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            }))
            ->limit(20)
            ->get(['id', 'name', 'email']);

        return response()->json($users);
    }
}
