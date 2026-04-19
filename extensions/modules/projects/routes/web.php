<?php

use Illuminate\Support\Facades\Route;
use Modules\Projects\Controllers\ProjectController;

// Module routes are loaded via AppServiceProvider, inside the {current_team} prefix group
if (class_exists(ProjectController::class)) {
    Route::resource('projects', ProjectController::class)
        ->only(['index', 'store', 'show', 'update', 'destroy'])
        ->names('projects');
}
