<?php

namespace Modules\AilesInvisibles\Services;

use Illuminate\Http\UploadedFile;
use Modules\AilesInvisibles\Enums\InvoiceStatus;
use Modules\AilesInvisibles\Models\Invoice;
use Modules\AilesInvisibles\Models\Payment;

class InvoiceService
{
    public function __construct(
        protected InvoiceNumberGenerator $numberGenerator,
        protected AccountingService $accountingService,
    ) {}

    public function createInvoice(int $teamId, array $attributes, ?UploadedFile $file = null): Invoice
    {
        $fileData = [];
        if ($file) {
            $fileData = $this->storeFile($file, 'ai-invoices');
        }

        $invoice = Invoice::create(array_merge($attributes, [
            'invoice_number' => $this->numberGenerator->generate($teamId),
            'status' => InvoiceStatus::Draft->value,
            'subtotal' => $attributes['subtotal'] ?? 0,
            'tax_amount' => $attributes['tax_amount'] ?? 0,
            'total' => $attributes['total'] ?? 0,
            'paid_amount' => 0,
            'version' => 1,
        ], $fileData));

        $this->accountingService->recordInvoice($invoice);

        return $invoice;
    }

    public function updateInvoice(Invoice $invoice, array $attributes, ?UploadedFile $file = null): Invoice
    {
        $updateData = $attributes;

        if ($file) {
            $fileData = $this->storeFile($file, 'ai-invoices');
            $updateData['previous_version_id'] = $invoice->id;
            $updateData['version'] = $invoice->version + 1;
            $updateData = array_merge($updateData, $fileData);
        }

        $invoice->update($updateData);

        return $invoice;
    }

    public function recordPayment(Invoice $invoice, array $paymentAttributes): Payment
    {
        $payment = Payment::create(array_merge($paymentAttributes, [
            'team_id' => $invoice->team_id,
            'invoice_id' => $invoice->id,
        ]));

        $invoice->refresh();
        $invoice->recalculate();
        $invoice->refresh();

        if ($invoice->paid_amount >= $invoice->total) {
            $invoice->update([
                'status' => InvoiceStatus::Paid->value,
                'paid_at' => now(),
            ]);
        } elseif ($invoice->paid_amount > 0) {
            $invoice->update(['status' => InvoiceStatus::Partial->value]);
        }

        $this->accountingService->recordPayment($payment);

        return $payment;
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
