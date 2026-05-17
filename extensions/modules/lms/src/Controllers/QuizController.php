<?php

namespace Modules\Lms\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Modules\Lms\Domain\Enrollment\Services\ProgressionService;
use Modules\Lms\Models\Course;
use Modules\Lms\Models\CourseSection;
use Modules\Lms\Models\Enrollment;
use Modules\Lms\Models\Lesson;
use Modules\Lms\Models\LessonProgress;
use Modules\Lms\Models\QuizAnswer;
use Modules\Lms\Models\QuizQuestion;
use Modules\Lms\Models\QuizResponse;

class QuizController extends Controller
{
    public function __construct(
        private readonly ProgressionService $progressionService,
    ) {}

    public function storeQuestion(Request $request): RedirectResponse
    {
        Gate::authorize('lms.courses.update');
        $lesson = Lesson::findOrFail($request->route('lesson'));
        $validated = $request->validate([
            'question_text' => 'required|string',
            'explanation' => 'nullable|string',
            'answers' => 'required|array|min:2',
            'answers.*.text' => 'required|string',
            'answers.*.is_correct' => 'boolean',
        ]);

        try {
            $question = $lesson->questions()->create([
                'question_text' => $validated['question_text'],
                'explanation' => $validated['explanation'] ?? null,
                'sort_order' => $lesson->questions()->count(),
            ]);

            foreach ($validated['answers'] as $index => $answer) {
                $question->answers()->create([
                    'answer_text' => $answer['text'],
                    'is_correct' => $answer['is_correct'] ?? false,
                    'sort_order' => $index,
                ]);
            }

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Quiz question created')]);

            return back();
        } catch (\Throwable $e) {
            Log::error('Quiz question creation failed: '.$e->getMessage());
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Error: ').$e->getMessage()]);

            return back();
        }
    }

    public function updateQuestion(Request $request): RedirectResponse
    {
        Gate::authorize('lms.courses.update');
        $question = QuizQuestion::findOrFail($request->route('question'));
        $validated = $request->validate([
            'question_text' => 'required|string',
            'explanation' => 'nullable|string',
        ]);

        $question->update($validated);
        Inertia::flash('toast', ['type' => 'success', 'message' => __('Quiz question updated')]);

        return back();
    }

    public function destroyQuestion(Request $request): RedirectResponse
    {
        Gate::authorize('lms.courses.delete');
        $question = QuizQuestion::findOrFail($request->route('question'));
        $question->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => __('Quiz question deleted')]);

        return back();
    }

    public function storeAnswer(Request $request): RedirectResponse
    {
        Gate::authorize('lms.courses.update');
        $question = QuizQuestion::findOrFail($request->route('question'));
        $validated = $request->validate([
            'answer_text' => 'required|string',
            'is_correct' => 'boolean',
        ]);

        $question->answers()->create([
            'answer_text' => $validated['answer_text'],
            'is_correct' => $validated['is_correct'] ?? false,
            'sort_order' => $question->answers()->count(),
        ]);

        return back();
    }

    public function destroyAnswer(Request $request): RedirectResponse
    {
        Gate::authorize('lms.courses.delete');
        $answer = QuizAnswer::findOrFail($request->route('answer'));
        $answer->delete();

        return back();
    }

    public function storeSectionQuestion(Request $request): RedirectResponse
    {
        Gate::authorize('lms.courses.update');
        $section = CourseSection::findOrFail($request->route('section'));
        $validated = $request->validate([
            'question_text' => 'required|string',
            'explanation' => 'nullable|string',
            'answers' => 'required|array|min:2',
            'answers.*.text' => 'required|string',
            'answers.*.is_correct' => 'boolean',
        ]);

        try {
            $question = $section->quizQuestions()->create([
                'question_text' => $validated['question_text'],
                'explanation' => $validated['explanation'] ?? null,
                'sort_order' => $section->quizQuestions()->count(),
            ]);

            foreach ($validated['answers'] as $index => $answer) {
                $question->answers()->create([
                    'answer_text' => $answer['text'],
                    'is_correct' => $answer['is_correct'] ?? false,
                    'sort_order' => $index,
                ]);
            }

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Quiz question created')]);

            return back();
        } catch (\Throwable $e) {
            Log::error('Section quiz creation failed: '.$e->getMessage());
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Error: ').$e->getMessage()]);

            return back();
        }
    }

    public function storeCourseQuestion(Request $request): RedirectResponse
    {
        Gate::authorize('lms.courses.update');
        $course = Course::findOrFail($request->route('course'));
        $validated = $request->validate([
            'question_text' => 'required|string',
            'explanation' => 'nullable|string',
            'answers' => 'required|array|min:2',
            'answers.*.text' => 'required|string',
            'answers.*.is_correct' => 'boolean',
        ]);

        try {
            $question = $course->quizQuestions()->create([
                'question_text' => $validated['question_text'],
                'explanation' => $validated['explanation'] ?? null,
                'sort_order' => $course->quizQuestions()->count(),
            ]);

            foreach ($validated['answers'] as $index => $answer) {
                $question->answers()->create([
                    'answer_text' => $answer['text'],
                    'is_correct' => $answer['is_correct'] ?? false,
                    'sort_order' => $index,
                ]);
            }

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Quiz question created')]);

            return back();
        } catch (\Throwable $e) {
            Log::error('Course quiz creation failed: '.$e->getMessage());
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Error: ').$e->getMessage()]);

            return back();
        }
    }

    public function submitQuiz(Request $request): RedirectResponse
    {
        Gate::authorize('lms.courses.learn');
        $lesson = Lesson::findOrFail($request->route('lesson'));
        $courseId = $request->route('course');
        $validQuestionIds = $lesson->questions()->pluck('lms_quiz_questions.id')->all();

        $response = $this->processQuizSubmission($request, $courseId, $validQuestionIds);

        // Auto-complete the lesson after submitting the quiz
        $enrollment = Enrollment::where('user_id', $request->user()->id)
            ->where('course_id', $courseId)
            ->firstOrFail();

        $this->progressionService->updateLessonProgress(
            $enrollment,
            $lesson,
            LessonProgress::COMPLETION_THRESHOLD,
        );

        return $response;
    }

    public function submitSectionQuiz(Request $request): RedirectResponse
    {
        Gate::authorize('lms.courses.learn');
        $section = CourseSection::findOrFail($request->route('section'));
        $courseId = $section->course_id;
        $validQuestionIds = $section->quizQuestions()->pluck('lms_quiz_questions.id')->all();

        return $this->processQuizSubmission($request, $courseId, $validQuestionIds);
    }

    public function submitCourseQuiz(Request $request): RedirectResponse
    {
        Gate::authorize('lms.courses.learn');
        $course = Course::findOrFail($request->route('course'));
        $validQuestionIds = $course->quizQuestions()->pluck('lms_quiz_questions.id')->all();

        return $this->processQuizSubmission($request, $course->id, $validQuestionIds);
    }

    private function processQuizSubmission(Request $request, int $courseId, array $validQuestionIds): RedirectResponse
    {
        $validated = $request->validate([
            'responses' => 'required|array',
            'responses.*.question_id' => 'required|integer|exists:lms_quiz_questions,id',
            'responses.*.answer_id' => 'required|integer|exists:lms_quiz_answers,id',
        ]);

        $enrollment = Enrollment::where('user_id', $request->user()->id)
            ->where('course_id', $courseId)
            ->firstOrFail();

        $alreadySubmitted = QuizResponse::where('enrollment_id', $enrollment->id)
            ->whereIn('question_id', collect($validated['responses'])->pluck('question_id'))
            ->exists();

        if ($alreadySubmitted) {
            return back()->with('toast', ['type' => 'error', 'message' => __('Quiz already submitted')]);
        }

        $correctCount = 0;
        $total = count($validated['responses']);

        foreach ($validated['responses'] as $response) {
            if (! in_array($response['question_id'], $validQuestionIds, true)) {
                continue;
            }

            $answer = QuizAnswer::query()
                ->where('id', $response['answer_id'])
                ->where('question_id', $response['question_id'])
                ->first();

            $isCorrect = $answer !== null && $answer->is_correct;

            if ($isCorrect) {
                $correctCount++;
            }

            QuizResponse::updateOrCreate(
                [
                    'enrollment_id' => $enrollment->id,
                    'question_id' => $response['question_id'],
                ],
                [
                    'answer_id' => $response['answer_id'],
                    'is_correct' => $isCorrect,
                    'attempted_at' => now(),
                ],
            );
        }

        Inertia::flash('toast', [
            'type' => $correctCount === $total ? 'success' : 'info',
            'message' => __(':correct/:total correct answers', ['correct' => $correctCount, 'total' => $total]),
        ]);

        return back();
    }
}
