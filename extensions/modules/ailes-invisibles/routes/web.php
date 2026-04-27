<?php

use Illuminate\Support\Facades\Route;
use Modules\AilesInvisibles\Controllers\AccountingController;
use Modules\AilesInvisibles\Controllers\CategoryController;
use Modules\AilesInvisibles\Controllers\ClientController;
use Modules\AilesInvisibles\Controllers\ConversationController;
use Modules\AilesInvisibles\Controllers\DocumentController;
use Modules\AilesInvisibles\Controllers\EventController;
use Modules\AilesInvisibles\Controllers\InvoiceController;
use Modules\AilesInvisibles\Controllers\MessageController;
use Modules\AilesInvisibles\Controllers\ProductController;
use Modules\AilesInvisibles\Controllers\QuoteController;

if (class_exists(ClientController::class)) {
    // Clients
    Route::resource('ai/clients', ClientController::class)
        ->only(['index', 'show', 'store', 'update', 'destroy'])
        ->names('ai.clients');
    Route::post('ai/clients/{client}/invite', [ClientController::class, 'invitePortal'])
        ->name('ai.clients.invite');

    // Categories
    Route::resource('ai/categories', CategoryController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->names('ai.categories');

    // Products
    Route::resource('ai/products', ProductController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->names('ai.products');

    // Events
    Route::resource('ai/events', EventController::class)
        ->only(['index', 'show', 'store', 'update', 'destroy'])
        ->names('ai.events');

    // Quotes
    Route::resource('ai/quotes', QuoteController::class)
        ->only(['index', 'show', 'store', 'update', 'destroy'])
        ->names('ai.quotes');
    Route::post('ai/quotes/{quote}/send', [QuoteController::class, 'send'])
        ->name('ai.quotes.send');
    Route::post('ai/quotes/{quote}/accept', [QuoteController::class, 'accept'])
        ->name('ai.quotes.accept');
    Route::post('ai/quotes/{quote}/convert', [QuoteController::class, 'convertToInvoice'])
        ->name('ai.quotes.convert');

    // Invoices
    Route::resource('ai/invoices', InvoiceController::class)
        ->only(['index', 'show', 'store', 'update', 'destroy'])
        ->names('ai.invoices');
    Route::post('ai/invoices/{invoice}/send', [InvoiceController::class, 'send'])
        ->name('ai.invoices.send');
    Route::post('ai/invoices/{invoice}/payment', [InvoiceController::class, 'recordPayment'])
        ->name('ai.invoices.payment');
    Route::post('ai/invoices/{invoice}/cancel', [InvoiceController::class, 'cancel'])
        ->name('ai.invoices.cancel');

    // Documents
    Route::resource('ai/documents', DocumentController::class)
        ->only(['index', 'store', 'show', 'destroy'])
        ->names('ai.documents');
    Route::get('ai/documents/{document}/download', [DocumentController::class, 'download'])
        ->name('ai.documents.download');

    // Accounting
    Route::get('ai/accounting/dashboard', [AccountingController::class, 'dashboard'])
        ->name('ai.accounting.dashboard');
    Route::get('ai/accounting/reports', [AccountingController::class, 'reports'])
        ->name('ai.accounting.reports');

    // Conversations — Inbox
    Route::get('ai/conversations/inbox', [ConversationController::class, 'inbox'])->name('ai.conversations.inbox');
    Route::put('ai/conversations/{conversation}/title', [ConversationController::class, 'updateTitle'])->name('ai.conversations.title');
    Route::post('ai/conversations/{conversation}/read', [ConversationController::class, 'markAsRead'])->name('ai.conversations.read');
    Route::get('ai/conversations/{conversation}/messages/{message}/download', [ConversationController::class, 'downloadAttachment'])->name('ai.conversations.messages.download');
    Route::post('ai/conversations/{conversation}/participants', [ConversationController::class, 'addParticipant'])->name('ai.conversations.participants.add');
    Route::delete('ai/conversations/{conversation}/participants/{participant}', [ConversationController::class, 'removeParticipant'])->name('ai.conversations.participants.remove');

    // Conversations — Legacy routes (kept during transition)
    Route::resource('ai/conversations', ConversationController::class)
        ->only(['index', 'store', 'show'])
        ->names('ai.conversations');
    Route::post('ai/conversations/{conversation}/archive', [ConversationController::class, 'archive'])
        ->name('ai.conversations.archive');
    Route::post('ai/conversations/{conversation}/unarchive', [ConversationController::class, 'unarchive'])
        ->name('ai.conversations.unarchive');
    Route::post('ai/conversations/{conversation}/messages', [MessageController::class, 'store'])
        ->name('ai.conversations.messages.store');
}
