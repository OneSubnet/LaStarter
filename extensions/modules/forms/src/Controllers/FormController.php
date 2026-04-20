<?php

namespace Modules\Forms\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Forms\Enums\FormStatus;
use Modules\Forms\Http\Requests\AddQuestionRequest;
use Modules\Forms\Http\Requests\StoreFormRequest;
use Modules\Forms\Http\Requests\UpdateFormRequest;
use Modules\Forms\Models\Form;
use Modules\Forms\Models\FormQuestion;

class FormController
{
    public function index(): Response
    {
        Gate::authorize('viewAny', Form::class);

        $forms = Form::query()
            ->with('creator')
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(fn (Form $form) => [
                'id' => $form->id,
                'title' => $form->title,
                'description' => $form->description,
                'slug' => $form->slug,
                'status' => $form->status,
                'responses_count' => $form->responses_count,
                'created_at' => $form->created_at->toISOString(),
                'creator' => $form->creator?->name,
            ]);

        return Inertia::render('forms/Index', [
            'forms' => $forms,
        ]);
    }

    public function show(Request $request): Response
    {
        $form = Form::with('questions')->findOrFail((int) $request->route('form'));

        Gate::authorize('view', $form);

        return Inertia::render('forms/Show', [
            'form' => [
                'id' => $form->id,
                'title' => $form->title,
                'description' => $form->description,
                'slug' => $form->slug,
                'status' => $form->status,
                'settings' => $form->settings,
                'responses_count' => $form->responses_count,
                'created_at' => $form->created_at->toISOString(),
                'updated_at' => $form->updated_at->toISOString(),
                'creator' => $form->creator?->name,
                'questions' => $form->questions->map(fn (FormQuestion $question) => [
                    'id' => $question->id,
                    'type' => $question->type,
                    'label' => $question->label,
                    'description' => $question->description,
                    'options' => $question->options,
                    'required' => $question->required,
                    'order' => $question->order,
                    'validation' => $question->validation,
                ])->values()->all(),
            ],
        ]);
    }

    public function store(StoreFormRequest $request): RedirectResponse
    {
        Gate::authorize('create', Form::class);

        Form::create([
            'title' => $request->validated('title'),
            'description' => $request->validated('description'),
            'user_id' => $request->user()->id,
            'status' => FormStatus::Draft->value,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Form created.')]);

        return to_route('forms.index', ['current_team' => $request->route('current_team')]);
    }

    public function update(UpdateFormRequest $request): RedirectResponse
    {
        $form = Form::findOrFail((int) $request->route('form'));

        Gate::authorize('update', $form);

        $form->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Form updated.')]);

        return back();
    }

    public function publish(Request $request): RedirectResponse
    {
        $form = Form::findOrFail((int) $request->route('form'));

        Gate::authorize('publish', $form);

        $form->update(['status' => FormStatus::Published->value]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Form published.')]);

        return back();
    }

    public function close(Request $request): RedirectResponse
    {
        $form = Form::findOrFail((int) $request->route('form'));

        Gate::authorize('publish', $form);

        $form->update(['status' => FormStatus::Closed->value]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Form closed.')]);

        return back();
    }

    public function destroy(Request $request): RedirectResponse
    {
        $form = Form::findOrFail((int) $request->route('form'));

        Gate::authorize('delete', $form);

        $form->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Form deleted.')]);

        return to_route('forms.index', ['current_team' => $request->route('current_team')]);
    }

    public function addQuestion(AddQuestionRequest $request): RedirectResponse
    {
        $form = Form::findOrFail((int) $request->route('form'));

        Gate::authorize('update', $form);

        $maxOrder = $form->questions()->max('order') ?? 0;

        $form->questions()->create([
            'type' => $request->validated('type'),
            'label' => $request->validated('label'),
            'description' => $request->validated('description'),
            'options' => $request->validated('options'),
            'required' => $request->validated('required', false),
            'order' => $maxOrder + 1,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Question added.')]);

        return back();
    }

    public function updateQuestion(Request $request): RedirectResponse
    {
        $form = Form::findOrFail((int) $request->route('form'));

        Gate::authorize('update', $form);

        $question = FormQuestion::where('form_id', $form->id)
            ->findOrFail((int) $request->route('question'));

        $question->update($request->validate([
            'type' => ['sometimes', 'string', 'in:text,textarea,email,number,select,radio,checkbox,date,file,rating,scale,yes_no'],
            'label' => ['sometimes', 'required', 'string'],
            'description' => ['nullable', 'string'],
            'options' => ['nullable', 'array'],
            'required' => ['sometimes', 'boolean'],
            'validation' => ['nullable', 'array'],
        ]));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Question updated.')]);

        return back();
    }

    public function removeQuestion(Request $request): RedirectResponse
    {
        $form = Form::findOrFail((int) $request->route('form'));

        Gate::authorize('update', $form);

        $question = FormQuestion::where('form_id', $form->id)
            ->findOrFail((int) $request->route('question'));

        $question->delete();

        // Reorder remaining questions
        $form->questions()
            ->where('order', '>', $question->order)
            ->decrement('order');

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Question removed.')]);

        return back();
    }

    public function reorderQuestions(Request $request): RedirectResponse
    {
        $form = Form::findOrFail((int) $request->route('form'));

        Gate::authorize('update', $form);

        $request->validate([
            'questions' => ['required', 'array'],
            'questions.*' => ['required', 'integer', 'exists:form_questions,id'],
        ]);

        $questionIds = $request->input('questions');

        foreach ($questionIds as $order => $id) {
            FormQuestion::where('form_id', $form->id)
                ->where('id', $id)
                ->update(['order' => $order + 1]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Questions reordered.')]);

        return back();
    }
}
