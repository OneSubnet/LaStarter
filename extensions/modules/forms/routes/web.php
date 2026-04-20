<?php

use Illuminate\Support\Facades\Route;
use Modules\Forms\Controllers\FormController;
use Modules\Forms\Controllers\FormSubmissionController;

// Module routes are loaded via ModuleServiceProvider, inside the {current_team} prefix group
if (class_exists(FormController::class)) {
    Route::resource('forms', FormController::class)
        ->only(['index', 'show', 'store', 'update', 'destroy'])
        ->names('forms');

    Route::post('forms/{form}/publish', [FormController::class, 'publish'])
        ->name('forms.publish');
    Route::post('forms/{form}/close', [FormController::class, 'close'])
        ->name('forms.close');
    Route::post('forms/{form}/questions', [FormController::class, 'addQuestion'])
        ->name('forms.questions.add');
    Route::patch('forms/{form}/questions/{question}', [FormController::class, 'updateQuestion'])
        ->name('forms.questions.update');
    Route::delete('forms/{form}/questions/{question}', [FormController::class, 'removeQuestion'])
        ->name('forms.questions.remove');
    Route::post('forms/{form}/questions/reorder', [FormController::class, 'reorderQuestions'])
        ->name('forms.questions.reorder');

    Route::post('forms/{form}/submit', [FormSubmissionController::class, 'submit'])
        ->name('forms.submit');
    Route::get('forms/{form}/submit', [FormSubmissionController::class, 'show'])
        ->name('forms.submit.show');
    Route::get('forms/{form}/responses', [FormSubmissionController::class, 'responses'])
        ->name('forms.responses');
    Route::delete('forms/{form}/responses/{submission}', [FormSubmissionController::class, 'destroy'])
        ->name('forms.responses.destroy');
}
