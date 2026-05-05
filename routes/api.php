<?php

use App\Http\Api\Controllers\TeamApiController;
use App\Http\Api\Controllers\UserApiController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->group(function () {
    // Team Routes
    Route::apiResource('teams', TeamApiController::class);

    // User Routes
    Route::apiResource('users', UserApiController::class)->only(['index', 'show', 'update', 'destroy']);
});
