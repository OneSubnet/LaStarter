<?php

namespace Modules\AilesInvisibles\Services;

use Illuminate\Http\UploadedFile;
use Modules\AilesInvisibles\Enums\InvoiceStatus;
use Modules\AilesInvisibles\Enums\QuoteStatus;
use Modules\AilesInvisibles\Models\Invoice;
use Modules\AilesInvisibles\Models\Quote;

class QuoteService
{
    public function __construct(
        protected QuoteNumberGenerator $quoteNumberGenerator,
        protected InvoiceNumberGenerator $invoiceNumberGenerator,
        protected AccountingService $accountingService,
    ) {}

    public function createQuote(int $teamId, array $attributes, ?UploadedFile $file = null): Quote
    {
        $fileData = [];
        if ($file) {
            $fileData = $this->storeFile($file, 'ai-quotes');
        }

        $quote = Quote::create(array_merge($attributes, [
            'quote_number' => $this->quoteNumberGenerator->generate($teamId),
            'status' => QuoteStatus::Draft->value,
            'subtotal' => $attributes['subtotal'] ?? 0,
            'tax_amount' => $attributes['tax_amount'] ?? 0,
            'total' => $attributes['total'] ?? 0,
            'version' => 1,
        ], $fileData));

        return $quote;
    }

    public function updateQuote(Quote $quote, array $attributes, ?UploadedFile $file = null): Quote
    {
        $updateData = $attributes;

        if ($file) {
            $fileData = $this->storeFile($file, 'ai-quotes');
            $updateData['previous_version_id'] = $quote->id;
            $updateData['version'] = $quote->version + 1;
            $updateData = array_merge($updateData, $fileData);
        }

        $quote->update($updateData);

        return $quote;
    }

    public function convertToInvoice(Quote $quote): Invoice
    {
        $invoice = Invoice::create([
            'team_id' => $quote->team_id,
            'client_id' => $quote->client_id,
            'quote_id' => $quote->id,
            'event_id' => $quote->event_id,
            'invoice_number' => $this->invoiceNumberGenerator->generate((int) $quote->team_id),
            'status' => InvoiceStatus::Draft->value,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'subtotal' => $quote->subtotal,
            'tax_amount' => $quote->tax_amount,
            'total' => $quote->total,
            'paid_amount' => 0,
            'notes' => $quote->notes,
            'file_path' => $quote->file_path,
            'file_name' => $quote->file_name,
            'file_size' => $quote->file_size,
            'version' => 1,
        ]);

        $this->accountingService->recordInvoice($invoice);

        $quote->update(['status' => QuoteStatus::Converted->value]);

        return $invoice;
    }

    protected function storeFile(UploadedFile $file, string $directory): array
    {
        $nextcloud = app(NextcloudStorageService::class);

        if ($nextcloud->isConfigured()) {
            $teamSlug = request()->user()->currentTeam?->slug ?? 'default';
            $content = file_get_contents($file->getRealPath());
            $remotePath = $nextcloud->upload(
                "{$directory}/".uniqid().'_'.$file->getClientOriginalName(),
                $content,
                $teamSlug
            );

            return [
                'file_path' => 'nextcloud:'.$remotePath,
                'file_name' => $file->getClientOriginalName(),
                'file_size' => $file->getSize(),
            ];
        }

        $filePath = $file->store($directory, 'local');

        return [
            'file_path' => $filePath,
            'file_name' => $file->getClientOriginalName(),
            'file_size' => $file->getSize(),
        ];
    }
}
