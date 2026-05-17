<?php

namespace Modules\Lms\Controllers;

use App\Core\Modules\CmsController;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Modules\Lms\Data\Course\CourseFormData;
use Modules\Lms\Data\Course\CourseRequestData;
use Modules\Lms\Data\Course\CourseRowData;
use Modules\Lms\Data\Enrollment\EnrollmentRowData;
use Modules\Lms\Models\Course;

class CourseController extends CmsController
{
    protected string $componentPath = 'lms/courses';

    protected string $model = Course::class;

    protected string $rowData = CourseRowData::class;

    protected string $formData = CourseFormData::class;

    protected string $requestData = CourseRequestData::class;

    protected string $route = 'lms.courses';

    protected string $searchField = 'title';

    public function index(Request $request): InertiaResponse
    {
        Gate::authorize('lms.courses.view');

        return $this->cmsIndex();
    }

    public function create(): InertiaResponse
    {
        Gate::authorize('lms.courses.create');

        return $this->cmsCreate();
    }

    public function store(CourseRequestData $data): RedirectResponse
    {
        Gate::authorize('lms.courses.create');

        return $this->cmsStore($data);
    }

    protected function cmsShow(Model $model): InertiaResponse
    {
        Gate::authorize('lms.courses.view');
        $model->load(['sections.lessons', 'sections.quizQuestions.answers', 'quizQuestions.answers', 'enrollments.user']);

        return Inertia::render("{$this->componentPath}/Show", [
            'item' => CourseFormData::fromModel($model),
            'sections' => $model->sections->map(fn ($s) => [
                'id' => $s->id,
                'title' => $s->title,
                'description' => $s->description,
                'sort_order' => $s->sort_order,
                'is_published' => $s->is_published,
                'quiz_questions' => $s->quizQuestions->map(fn ($q) => [
                    'id' => $q->id,
                    'question_text' => $q->question_text,
                    'answers' => $q->answers->map(fn ($a) => [
                        'id' => $a->id,
                        'answer_text' => $a->answer_text,
                        'is_correct' => $a->is_correct,
                    ])->all(),
                ])->all(),
                'lessons' => $s->lessons->map(fn ($l) => [
                    'id' => $l->id,
                    'title' => $l->title,
                    'content_type' => $l->content_type,
                    'sort_order' => $l->sort_order,
                    'is_published' => $l->is_published,
                    'video_duration_seconds' => $l->video_duration_seconds,
                ]),
            ]),
            'courseQuizQuestions' => $model->quizQuestions->map(fn ($q) => [
                'id' => $q->id,
                'question_text' => $q->question_text,
                'answers' => $q->answers->map(fn ($a) => [
                    'id' => $a->id,
                    'answer_text' => $a->answer_text,
                    'is_correct' => $a->is_correct,
                ])->all(),
            ])->all(),
            'enrollments' => $model->enrollments->map(fn ($e) => EnrollmentRowData::fromModel($e)),
        ]);
    }

    public function edit(Request $request): InertiaResponse
    {
        Gate::authorize('lms.courses.update');
        $course = Course::findOrFail($request->route('course'));

        return $this->cmsEdit($course);
    }

    public function update(Request $request): RedirectResponse
    {
        Gate::authorize('lms.courses.update');
        $course = Course::findOrFail($request->route('course'));
        $data = CourseRequestData::from($request);

        return $this->cmsUpdate($course, $data);
    }

    public function destroy(Request $request): RedirectResponse
    {
        Gate::authorize('lms.courses.delete');
        $course = Course::findOrFail($request->route('course'));

        try {
            return $this->cmsDestroy($course);
        } catch (\Throwable $e) {
            Log::error('Course deletion failed: '.$e->getMessage());
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Error: ').$e->getMessage()]);

            return back();
        }
    }

    public function publish(Request $request): RedirectResponse
    {
        Gate::authorize('lms.courses.publish');
        $course = Course::findOrFail($request->route('course'));

        try {
            $course->update(['status' => 'published']);
            Inertia::flash('toast', ['type' => 'success', 'message' => __('Course published')]);

            return back();
        } catch (\Throwable $e) {
            Log::error('Course publish failed: '.$e->getMessage());
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Error: ').$e->getMessage()]);

            return back();
        }
    }
}
