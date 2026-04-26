<?php

namespace Modules\AilesInvisibles\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_id' => ['required', 'exists:ai_clients,id'],
            'event_id' => ['nullable', 'exists:ai_events,id'],
            'subject' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'valid_until' => ['nullable', 'date'],
            'subtotal' => ['required', 'numeric', 'min:0'],
            'tax_amount' => ['nullable', 'numeric', 'min:0'],
            'total' => ['required', 'numeric', 'min:0'],
            'file' => ['nullable', 'file', 'mimes:pdf', 'max:51200'],
        ];
    }
}
