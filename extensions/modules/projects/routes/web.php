<?php

use Illuminate\Support\Facades\Route;
use Modules\Projects\Controllers\ProjectController;

Route::resource('projects', ProjectController::class)->only([
    'index', 'store', 'show', 'update', 'destroy',
]);
