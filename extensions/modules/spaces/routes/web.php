<?php

use Illuminate\Support\Facades\Route;
use Modules\Spaces\Controllers\SpaceController;
use Modules\Spaces\Controllers\SpaceDocumentController;
use Modules\Spaces\Controllers\SpaceDeletionRequestController;

if (class_exists(SpaceController::class)) {
    Route::resource('spaces', SpaceController::class)
        ->only(['index', 'show', 'store', 'update', 'destroy'])
        ->names('spaces');

    Route::post('spaces/{space}/members', [SpaceController::class, 'addMember'])
        ->name('spaces.members.add');
    Route::delete('spaces/{space}/members/{user}', [SpaceController::class, 'removeMember'])
        ->name('spaces.members.remove');

    Route::post('spaces/{space}/documents/upload', [SpaceDocumentController::class, 'upload'])
        ->name('spaces.documents.upload');
    Route::post('spaces/{space}/documents/{document}/assign', [SpaceDocumentController::class, 'assign'])
        ->name('spaces.documents.assign');
    Route::post('spaces/{space}/documents/{document}/sign', [SpaceDocumentController::class, 'sign'])
        ->name('spaces.documents.sign');
    Route::get('spaces/{space}/documents/{document}/download', [SpaceDocumentController::class, 'download'])
        ->name('spaces.documents.download');
    Route::delete('spaces/{space}/documents/{document}', [SpaceDocumentController::class, 'destroy'])
        ->name('spaces.documents.destroy');

    Route::post('deletion-requests', [SpaceDeletionRequestController::class, 'request'])
        ->name('deletion-requests.store');
    Route::delete('deletion-requests/{deletion_request}', [SpaceDeletionRequestController::class, 'cancel'])
        ->name('deletion-requests.cancel');
    Route::patch('deletion-requests/{deletion_request}/review', [SpaceDeletionRequestController::class, 'review'])
        ->name('deletion-requests.review');
}
