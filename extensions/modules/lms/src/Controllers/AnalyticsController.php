<?php

namespace Modules\Lms\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Lms\Models\Course;
use Modules\Lms\Models\LearningActivity;
use Modules\Lms\Models\QuizResponse;

class AnalyticsController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('lms.courses.analytics');
        $course = Course::findOrFail($request->route('course'));

        $course->loadMissing('sections.lessons');
        $enrollments = $course->enrollments()->with(['user', 'lessonProgress'])->get();
        $enrollmentIds = $enrollments->pluck('id');
        $totalEnrollments = $enrollments->count();
        $completedEnrollments = $enrollments->where('progress', '>=', 100)->count();
        $avgProgress = $totalEnrollments > 0 ? round($enrollments->avg('progress')) : 0;

        // Lesson-by-lesson completion — build a lookup map instead of per-lesson loops
        $lessons = $course->sections->flatMap->lessons;
        $completedByLesson = [];
        foreach ($enrollments as $enrollment) {
            foreach ($enrollment->lessonProgress as $progress) {
                if ($progress->isCompleted()) {
                    $completedByLesson[$progress->lesson_id] = ($completedByLesson[$progress->lesson_id] ?? 0) + 1;
                }
            }
        }
        $lessonStats = $lessons->map(function ($lesson) use ($completedByLesson, $totalEnrollments) {
            $completedCount = $completedByLesson[$lesson->id] ?? 0;

            return [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'completion_rate' => $totalEnrollments > 0 ? round(($completedCount / $totalEnrollments) * 100) : 0,
            ];
        });

        // Quiz statistics — bulk-load all responses, group in PHP
        $quizLessons = $lessons->where('content_type', 'quiz');
        $quizLessons->load('questions.answers');

        $allQuestionIds = $quizLessons->flatMap->questions->pluck('id');
        $allAnswerIds = $quizLessons->flatMap->questions->flatMap->answers->pluck('id');

        // Single query for all question-level stats
        $responsesByQuestion = $allQuestionIds->isNotEmpty()
            ? QuizResponse::whereIn('question_id', $allQuestionIds)
                ->whereIn('enrollment_id', $enrollmentIds)
                ->selectRaw('question_id, COUNT(*) as total, SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct')
                ->groupBy('question_id')
                ->get()
                ->keyBy('question_id')
            : collect();

        // Single query for all answer-level stats
        $responsesByAnswer = $allAnswerIds->isNotEmpty()
            ? QuizResponse::whereIn('answer_id', $allAnswerIds)
                ->whereIn('enrollment_id', $enrollmentIds)
                ->selectRaw('answer_id, COUNT(*) as total')
                ->groupBy('answer_id')
                ->get()
                ->keyBy('answer_id')
            : collect();

        $quizStats = $quizLessons->map(function ($lesson) use ($responsesByQuestion, $responsesByAnswer) {
            return [
                'lesson_id' => $lesson->id,
                'lesson_title' => $lesson->title,
                'questions' => $lesson->questions->map(function ($question) use ($responsesByQuestion, $responsesByAnswer) {
                    $row = $responsesByQuestion->get($question->id);

                    return [
                        'id' => $question->id,
                        'question_text' => $question->question_text,
                        'total_responses' => $row ? (int) $row->total : 0,
                        'correct_count' => $row ? (int) $row->correct : 0,
                        'answers' => $question->answers->map(function ($answer) use ($responsesByAnswer) {
                            $answerRow = $responsesByAnswer->get($answer->id);

                            return [
                                'id' => $answer->id,
                                'answer_text' => $answer->answer_text,
                                'is_correct' => $answer->is_correct,
                                'selection_count' => $answerRow ? (int) $answerRow->total : 0,
                            ];
                        })->values()->all(),
                    ];
                })->values()->all(),
            ];
        })->values()->all();

        // Activity over last 30 days
        $activities = LearningActivity::whereHas('enrollment', fn ($q) => $q->where('course_id', $course->id))
            ->where('activity_date', '>=', now()->subDays(30))
            ->selectRaw('activity_date, SUM(time_spent_seconds) as total_time, COUNT(DISTINCT enrollment_id) as active_learners')
            ->groupBy('activity_date')
            ->orderBy('activity_date')
            ->get();

        return Inertia::render('lms/courses/Analytics', [
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
            ],
            'stats' => [
                'total_enrollments' => $totalEnrollments,
                'completed_enrollments' => $completedEnrollments,
                'completion_rate' => $totalEnrollments > 0 ? round(($completedEnrollments / $totalEnrollments) * 100) : 0,
                'avg_progress' => $avgProgress,
                'total_lessons' => $lessons->count(),
            ],
            'lessonStats' => $lessonStats,
            'quizStats' => $quizStats,
            'activityChart' => $activities,
        ]);
    }
}
