<?php

namespace Modules\Lms\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use League\CommonMark\CommonMarkConverter;
use Modules\Lms\Domain\Enrollment\Services\ProgressionService;
use Modules\Lms\Models\Course;
use Modules\Lms\Models\CourseSection;
use Modules\Lms\Models\Enrollment;
use Modules\Lms\Models\LearningActivity;
use Modules\Lms\Models\Lesson;
use Modules\Lms\Models\LessonComment;
use Modules\Lms\Models\LessonNote;
use Modules\Lms\Models\LessonProgress;
use Modules\Lms\Models\QuizResponse;

class LearningController extends Controller
{
    public function __construct(
        private readonly ProgressionService $progressionService,
        private readonly CommonMarkConverter $converter = new CommonMarkConverter([
            'html_input' => 'strip',
            'allow_unsafe_links' => false,
        ]),
    ) {}

    public function index(Request $request): Response
    {
        $teamId = $request->user()->currentTeam->id;
        $userId = $request->user()->id;

        $enrollments = Enrollment::where('team_id', $teamId)
            ->where('user_id', $userId)
            ->where('role', 'learner')
            ->active()
            ->with(['course' => fn ($q) => $q->withCount(['sections', 'enrollments'])])
            ->latest('enrolled_at')
            ->get()
            ->map(function (Enrollment $enrollment) {
                $lastProgress = LessonProgress::where('enrollment_id', $enrollment->id)
                    ->where('progress', '>', 0)
                    ->latest('updated_at')
                    ->with('lesson')
                    ->first();

                $enrollment->last_lesson_title = $lastProgress?->lesson?->title;

                return $enrollment;
            });

        // Load bookmarked lessons for the dashboard
        $bookmarkedLessonIds = LessonProgress::where('enrollment_id', $enrollments->pluck('id')->toArray())
            ->where('is_bookmarked', true)
            ->with('lesson.section.course')
            ->get()
            ->map(fn (LessonProgress $lp) => [
                'course_id' => $lp->lesson?->section?->course?->id ?? $lp->lesson?->course_id,
                'course_title' => $lp->lesson?->section?->course?->title ?? '',
                'lesson_id' => $lp->lesson_id,
                'lesson_title' => $lp->lesson?->title ?? '',
            ]);

        return Inertia::render('lms/learn/Index', [
            'enrollments' => $enrollments,
            'bookmarkedLessons' => $bookmarkedLessonIds,
        ]);
    }

    public function show(Request $request): RedirectResponse
    {
        $course = Course::findOrFail($request->route('course'));
        $userId = $request->user()->id;
        $enrollment = $course->enrollments()
            ->where('user_id', $userId)
            ->firstOrFail();

        $course->load(['sections.lessons' => fn ($q) => $q->orderBy('sort_order')]);

        $progressMap = LessonProgress::where('enrollment_id', $enrollment->id)
            ->get()
            ->keyBy('lesson_id');

        $teamSlug = $request->route('current_team')?->slug ?? $request->user()?->currentTeam?->slug ?? '';

        // Find the next incomplete lesson, or fall back to the first lesson
        $allLessons = $course->sections->flatMap->lessons;
        $nextLesson = $allLessons->first(
            fn ($l) => ! $progressMap->has($l->id) || $progressMap[$l->id]->progress < LessonProgress::COMPLETION_THRESHOLD,
        );

        // If no incomplete lesson, check for section quizzes and course quiz
        if (! $nextLesson) {
            // Check if any section has a quiz that hasn't been answered
            foreach ($course->sections as $section) {
                $sectionQuizQuestions = $section->quizQuestions;
                if ($sectionQuizQuestions->isNotEmpty()) {
                    $answered = QuizResponse::where('enrollment_id', $enrollment->id)
                        ->whereIn('question_id', $sectionQuizQuestions->pluck('id'))
                        ->exists();
                    if (! $answered) {
                        return redirect()->to("/{$teamSlug}/lms/learn/{$course->id}/sections/{$section->id}/quiz");
                    }
                }
            }

            // Check course quiz
            $courseQuizQuestions = $course->quizQuestions;
            if ($courseQuizQuestions->isNotEmpty()) {
                $answered = QuizResponse::where('enrollment_id', $enrollment->id)
                    ->whereIn('question_id', $courseQuizQuestions->pluck('id'))
                    ->exists();
                if (! $answered) {
                    return redirect()->to("/{$teamSlug}/lms/learn/{$course->id}/quiz");
                }
            }

            return redirect()->to("/{$teamSlug}/lms/learn");
        }

        return redirect()->to("/{$teamSlug}/lms/learn/{$course->id}/lessons/{$nextLesson->id}");
    }

    public function lesson(Request $request): Response
    {
        $course = Course::findOrFail($request->route('course'));
        $lesson = Lesson::findOrFail($request->route('lesson'));
        $userId = $request->user()->id;
        $enrollment = $course->enrollments()
            ->where('user_id', $userId)
            ->firstOrFail();

        if ($enrollment->isBlocked()) {
            abort(403, __('Your access to this course has been restricted.'));
        }

        $lessonProgress = LessonProgress::firstOrCreate(
            ['enrollment_id' => $enrollment->id, 'lesson_id' => $lesson->id],
            ['status' => 'in_progress', 'progress' => 0],
        );

        // Load quiz data only when lesson is completed
        $quizData = [];
        $quizResponses = [];
        $lessonCompleted = $lessonProgress->progress >= LessonProgress::COMPLETION_THRESHOLD;
        if ($lesson->content_type === 'quiz' && $lessonCompleted) {
            $lesson->load('questions.answers');
            $quizData = $lesson->questions->map(fn ($q) => [
                'id' => $q->id,
                'question_text' => $q->question_text,
                'explanation' => $q->explanation,
                'answers' => $q->answers->map(fn ($a) => [
                    'id' => $a->id,
                    'answer_text' => $a->answer_text,
                ])->all(),
            ])->all();

            $quizResponses = QuizResponse::where('enrollment_id', $enrollment->id)
                ->whereIn('question_id', $lesson->questions->pluck('id'))
                ->get()
                ->map(fn ($r) => [
                    'question_id' => $r->question_id,
                    'answer_id' => $r->answer_id,
                    'is_correct' => $r->is_correct,
                ])->all();
        }

        // Load note content
        $noteContent = '';
        $note = LessonNote::where('enrollment_id', $enrollment->id)
            ->where('lesson_id', $lesson->id)
            ->first();
        if ($note) {
            $noteContent = $note->content;
        }

        // Load comments
        $comments = LessonComment::where('lesson_id', $lesson->id)
            ->whereNull('parent_id')
            ->with(['user', 'reactions', 'replies.user', 'replies.reactions'])
            ->oldest()
            ->get()
            ->map(fn (LessonComment $c) => $this->mapComment($c, $request->user()->id));

        // Load course structure for sidebar
        $course->load(['sections.lessons' => fn ($q) => $q->orderBy('sort_order')]);

        // Build sidebar sections with progress status
        $allLessonIds = $course->sections->flatMap->lessons->pluck('id');
        $sidebarProgress = LessonProgress::where('enrollment_id', $enrollment->id)
            ->whereIn('lesson_id', $allLessonIds)
            ->get()
            ->keyBy('lesson_id');

        $sidebarSections = $course->sections->map(fn ($section) => [
            'id' => $section->id,
            'title' => $section->title,
            'lessons' => $section->lessons->map(fn ($l) => [
                'id' => $l->id,
                'title' => $l->title,
                'content_type' => $l->content_type,
                'video_duration_seconds' => $l->video_duration_seconds,
                'status' => $sidebarProgress[$l->id]?->status ?? 'not_started',
                'progress' => $sidebarProgress[$l->id]?->progress ?? 0,
            ])->all(),
        ])->all();

        // Previous / next lesson
        $flatLessons = $course->sections->flatMap->lessons;
        $currentIdx = $flatLessons->search(fn ($l) => $l->id === $lesson->id);
        $prevLesson = $currentIdx > 0 ? $flatLessons[$currentIdx - 1] : null;
        $nextLesson = $currentIdx < $flatLessons->count() - 1 ? $flatLessons[$currentIdx + 1] : null;

        // Course settings for feature gating
        $settings = is_array($course->settings) ? $course->settings : [];
        $courseSettings = [
            'enable_comments' => $settings['enable_comments'] ?? true,
            'enable_notes' => $settings['enable_notes'] ?? true,
            'enable_bookmarks' => $settings['enable_bookmarks'] ?? true,
            'enable_certificate' => $course->certificate_enabled ?? true,
        ];

        $lessonData = $lesson->toArray();
        if ($lesson->content_type === 'text' && $lesson->content) {
            $lessonData['content'] = (string) $this->converter->convert($lesson->content);
        }

        return Inertia::render('lms/learn/Lesson', [
            'course' => $course->only(['id', 'title', 'slug']),
            'lesson' => $lessonData,
            'lessonProgress' => $lessonProgress,
            'isBookmarked' => $lessonProgress->is_bookmarked ?? false,
            'questions' => $quizData,
            'quizResponses' => $quizResponses,
            'noteContent' => $noteContent,
            'comments' => $comments,
            'courseSettings' => $courseSettings,
            'sidebarSections' => $sidebarSections,
            'prevLesson' => $prevLesson ? ['id' => $prevLesson->id, 'title' => $prevLesson->title] : null,
            'nextLesson' => $nextLesson ? ['id' => $nextLesson->id, 'title' => $nextLesson->title] : null,
            'enrollmentProgress' => $enrollment->progress,
        ]);
    }

    public function completeLesson(Request $request): RedirectResponse
    {
        $course = Course::findOrFail($request->route('course'));
        $lesson = Lesson::findOrFail($request->route('lesson'));
        $enrollment = $course->enrollments()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $this->progressionService->updateLessonProgress(
            $enrollment,
            $lesson,
            LessonProgress::COMPLETION_THRESHOLD,
        );

        $this->logActivity($enrollment->id, $lesson->id, 30);

        return back()->with('toast', ['type' => 'success', 'message' => __('Lesson completed!')]);
    }

    public function uncompleteLesson(Request $request): RedirectResponse
    {
        $course = Course::findOrFail($request->route('course'));
        $lesson = Lesson::findOrFail($request->route('lesson'));
        $enrollment = $course->enrollments()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        LessonProgress::where('enrollment_id', $enrollment->id)
            ->where('lesson_id', $lesson->id)
            ->update([
                'status' => 'in_progress',
                'progress' => 0,
                'completed_at' => null,
            ]);

        $this->progressionService->recalculateCourseProgress($enrollment);

        return back()->with('toast', ['type' => 'success', 'message' => __('Lesson marked as incomplete.')]);
    }

    public function sectionQuiz(Request $request): Response
    {
        $course = Course::findOrFail($request->route('course'));
        $section = CourseSection::findOrFail($request->route('section'));
        $userId = $request->user()->id;
        $enrollment = $course->enrollments()
            ->where('user_id', $userId)
            ->firstOrFail();

        if ($enrollment->isBlocked()) {
            abort(403, __('Your access to this course has been restricted.'));
        }

        $section->load('quizQuestions.answers');
        $questions = $section->quizQuestions->map(fn ($q) => [
            'id' => $q->id,
            'question_text' => $q->question_text,
            'explanation' => $q->explanation,
            'answers' => $q->answers->map(fn ($a) => [
                'id' => $a->id,
                'answer_text' => $a->answer_text,
            ])->all(),
        ])->all();

        $quizResponses = QuizResponse::where('enrollment_id', $enrollment->id)
            ->whereIn('question_id', $section->quizQuestions->pluck('id'))
            ->get()
            ->map(fn ($r) => [
                'question_id' => $r->question_id,
                'answer_id' => $r->answer_id,
                'is_correct' => $r->is_correct,
            ])->all();

        $teamSlug = $request->route('current_team')?->slug ?? $request->user()?->currentTeam?->slug ?? '';

        return Inertia::render('lms/learn/SectionQuiz', [
            'course' => $course->only(['id', 'title', 'slug']),
            'section' => $section->only(['id', 'title']),
            'questions' => $questions,
            'quizResponses' => $quizResponses,
        ]);
    }

    public function courseQuiz(Request $request): Response
    {
        $course = Course::findOrFail($request->route('course'));
        $userId = $request->user()->id;
        $enrollment = $course->enrollments()
            ->where('user_id', $userId)
            ->firstOrFail();

        if ($enrollment->isBlocked()) {
            abort(403, __('Your access to this course has been restricted.'));
        }

        $course->load('quizQuestions.answers');
        $questions = $course->quizQuestions->map(fn ($q) => [
            'id' => $q->id,
            'question_text' => $q->question_text,
            'explanation' => $q->explanation,
            'answers' => $q->answers->map(fn ($a) => [
                'id' => $a->id,
                'answer_text' => $a->answer_text,
            ])->all(),
        ])->all();

        $quizResponses = QuizResponse::where('enrollment_id', $enrollment->id)
            ->whereIn('question_id', $course->quizQuestions->pluck('id'))
            ->get()
            ->map(fn ($r) => [
                'question_id' => $r->question_id,
                'answer_id' => $r->answer_id,
                'is_correct' => $r->is_correct,
            ])->all();

        return Inertia::render('lms/learn/CourseQuiz', [
            'course' => $course->only(['id', 'title', 'slug']),
            'questions' => $questions,
            'quizResponses' => $quizResponses,
        ]);
    }

    public function updateProgress(Request $request)
    {
        $course = Course::findOrFail($request->route('course'));
        $lesson = Lesson::findOrFail($request->route('lesson'));
        $validated = $request->validate([
            'progress' => 'required|integer|min:0|max:1000',
            'time_spent_seconds' => 'nullable|integer',
            'last_position' => 'nullable|integer',
        ]);

        $userId = $request->user()->id;
        $enrollment = $course->enrollments()
            ->where('user_id', $userId)
            ->firstOrFail();

        $this->progressionService->updateLessonProgress(
            $enrollment,
            $lesson,
            $validated['progress'],
            $validated['time_spent_seconds'] ?? null,
            $validated['last_position'] ?? null,
        );

        if (($validated['time_spent_seconds'] ?? 0) > 0) {
            $this->logActivity($enrollment->id, $lesson->id, (int) $validated['time_spent_seconds']);
        }

        return response()->json(['ok' => true]);
    }

    public function bookmark(Request $request): RedirectResponse
    {
        $enrollment = Enrollment::where('user_id', $request->user()->id)
            ->where('team_id', $request->user()->currentTeam->id)
            ->where('course_id', $request->route('course'))
            ->firstOrFail();

        $progress = LessonProgress::where('enrollment_id', $enrollment->id)
            ->where('lesson_id', $request->route('lesson'))
            ->first();

        if ($progress) {
            $progress->update(['is_bookmarked' => ! $progress->is_bookmarked]);
        } else {
            $enrollment->lessonProgress()->create([
                'lesson_id' => $request->route('lesson'),
                'status' => 'not_started',
                'progress' => 0,
                'is_bookmarked' => true,
            ]);
        }

        return back();
    }

    private function mapComment(LessonComment $comment, int $userId): array
    {
        return [
            'id' => $comment->id,
            'content' => $comment->content,
            'user' => [
                'id' => $comment->user->id,
                'name' => $comment->user->name,
            ],
            'created_at' => $comment->created_at->toISOString(),
            'reactions' => $comment->reactions->groupBy('emoji')->map(fn ($group) => [
                'emoji' => $group->first()->emoji,
                'count' => $group->count(),
                'hasReacted' => $group->contains('user_id', $userId),
            ])->values()->all(),
            'replies' => $comment->replies->map(fn (LessonComment $reply) => $this->mapComment($reply, $userId))->all(),
        ];
    }

    private function logActivity(int $enrollmentId, int $lessonId, int $seconds): void
    {
        $date = now()->toDateString();
        $existing = LearningActivity::where('enrollment_id', $enrollmentId)
            ->where('lesson_id', $lessonId)
            ->whereDate('activity_date', $date)
            ->first();

        if ($existing) {
            $existing->increment('time_spent_seconds', $seconds);
        } else {
            LearningActivity::create([
                'enrollment_id' => $enrollmentId,
                'lesson_id' => $lessonId,
                'activity_date' => $date,
                'time_spent_seconds' => $seconds,
            ]);
        }
    }
}
