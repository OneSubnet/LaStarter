<?php

use Illuminate\Support\Facades\Route;
use Modules\Tasks\Controllers\TaskController;

if (class_exists(TaskController::class)) {
    Route::resource('tasks', TaskController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->names('tasks');
}
