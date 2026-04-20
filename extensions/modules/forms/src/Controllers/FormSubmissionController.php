<?php

namespace Modules\Forms\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Forms\Http\Requests\SubmitFormRequest;
use Modules\Forms\Models\Form;
use Modules\Forms\Models\FormSubmission;

class FormSubmissionController
{
    public function show(Request $request): Response
    {
        $form = Form::with('questions')->findOrFail((int) $request->route('form'));

        if ($form->status !== 'published') {
            abort(404);
        }

        return Inertia::render('forms/Submit', [
            'form' => [
                'id' => $form->id,
                'title' => $form->title,
                'description' => $form->description,
                'questions' => $form->questions->sortBy('order')->map(fn ($q) => [
                    'id' => $q->id,
                    'type' => $q->type,
                    'label' => $q->label,
                    'description' => $q->description,
                    'options' => $q->options,
                    'required' => $q->required,
                ])->values()->all(),
            ],
        ]);
    }

    public function submit(SubmitFormRequest $request): RedirectResponse
    {
        $form = Form::with('questions')->findOrFail((int) $request->route('form'));

        FormSubmission::create([
            'form_id' => $form->id,
            'user_id' => $request->user()?->id,
            'status' => 'completed',
            'responses' => $request->validated('responses'),
        ]);

        $form->increment('responses_count');

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Form submitted.')]);

        return back();
    }

    public function responses(Request $request): Response
    {
        $form = Form::findOrFail((int) $request->route('form'));

        Gate::authorize('view', FormSubmission::class);

        $submissions = $form->submissions()
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (FormSubmission $submission) => [
                'id' => $submission->id,
                'user' => $submission->user?->name,
                'status' => $submission->status,
                'responses' => $submission->responses,
                'created_at' => $submission->created_at->toISOString(),
            ]);

        return Inertia::render('forms/Responses', [
            'form' => [
                'id' => $form->id,
                'title' => $form->title,
            ],
            'submissions' => $submissions,
        ]);
    }

    public function destroy(Request $request): RedirectResponse
    {
        $form = Form::findOrFail((int) $request->route('form'));

        Gate::authorize('delete', FormSubmission::class);

        $submission = FormSubmission::where('form_id', $form->id)
            ->findOrFail((int) $request->route('submission'));

        $submission->delete();

        $form->decrement('responses_count');

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Submission deleted.')]);

        return back();
    }
}
