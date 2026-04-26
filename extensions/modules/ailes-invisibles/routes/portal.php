<?php

use Illuminate\Support\Facades\Route;
use Modules\AilesInvisibles\Controllers\ClientPortalController;

// Unauthenticated routes — no team prefix needed
Route::get('/portal/login', [ClientPortalController::class, 'showLogin'])->name('portal.login');
Route::post('/portal/login', [ClientPortalController::class, 'login'])->middleware('throttle:5,1');
Route::get('/portal/forgot-password', [ClientPortalController::class, 'showForgotPassword'])->name('portal.password.request');
Route::post('/portal/forgot-password', [ClientPortalController::class, 'sendResetLink'])->middleware('throttle:5,1')->name('portal.password.email');
Route::get('/portal/reset-password/{token}', [ClientPortalController::class, 'showResetPassword'])->name('portal.password.reset');
Route::post('/portal/reset-password', [ClientPortalController::class, 'resetPassword'])->name('portal.password.reset.post');
Route::get('/portal/magic/{token}', [ClientPortalController::class, 'magicLink'])->name('portal.magic');
Route::get('/portal/accept/{token}', [ClientPortalController::class, 'showAcceptInvitation'])->name('portal.accept');
Route::post('/portal/accept/{token}', [ClientPortalController::class, 'acceptInvitation'])->name('portal.accept.post');

// Authenticated routes — scoped to {team}
Route::middleware('auth.client')->prefix('{team}/portal')->group(function () {
    Route::post('/logout', [ClientPortalController::class, 'logout'])->name('portal.logout');
    Route::get('/dashboard', [ClientPortalController::class, 'dashboard'])->name('portal.dashboard');
    Route::get('/documents', [ClientPortalController::class, 'documents'])->name('portal.documents');
    Route::get('/documents/{id}/download', [ClientPortalController::class, 'downloadDocument'])->name('portal.documents.download');
    Route::post('/documents/{id}/sign', [ClientPortalController::class, 'signDocument'])->name('portal.documents.sign');
    Route::get('/invoices', [ClientPortalController::class, 'invoices'])->name('portal.invoices');
    Route::get('/invoices/{id}/download', [ClientPortalController::class, 'downloadInvoice'])->name('portal.invoices.download');
    Route::get('/quotes', [ClientPortalController::class, 'quotes'])->name('portal.quotes');
    Route::get('/quotes/{id}/download', [ClientPortalController::class, 'downloadQuote'])->name('portal.quotes.download');
    Route::get('/chat', [ClientPortalController::class, 'redirectToInbox'])->name('portal.chat');
    Route::post('/chat', [ClientPortalController::class, 'createConversation'])->name('portal.chat.store');
    Route::get('/chat/inbox', [ClientPortalController::class, 'inbox'])->name('portal.chat.inbox');
    Route::put('/chat/{id}/title', [ClientPortalController::class, 'updateTitle'])->name('portal.chat.title');
    Route::get('/chat/{id}', [ClientPortalController::class, 'redirectToInboxWithConversation'])->name('portal.chat.show');
    Route::post('/chat/{id}/messages', [ClientPortalController::class, 'sendMessage'])->name('portal.chat.send');
    Route::post('/chat/{id}/read', [ClientPortalController::class, 'markAsReadPortal'])->name('portal.chat.read');
    Route::get('/chat/{id}/messages/{messageId}/download', [ClientPortalController::class, 'downloadAttachmentPortal'])->name('portal.chat.download');
    Route::post('/chat/{id}/archive', [ClientPortalController::class, 'archiveConversation'])->name('portal.chat.archive');
    Route::post('/chat/{id}/unarchive', [ClientPortalController::class, 'unarchiveConversation'])->name('portal.chat.unarchive');
    Route::get('/settings', [ClientPortalController::class, 'settings'])->name('portal.settings');
    Route::put('/profile', [ClientPortalController::class, 'updateProfile'])->name('portal.profile.update');
    Route::put('/password', [ClientPortalController::class, 'updatePassword'])->name('portal.password.change');
    Route::put('/locale', [ClientPortalController::class, 'updateLocale'])->name('portal.locale.update');
});
