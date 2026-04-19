<?php

namespace Modules\Spaces\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadDocumentRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:25600'],
            'name' => ['required', 'string', 'max:255'],
            'instructions' => ['nullable', 'string'],
            'requires_signature' => ['sometimes', 'boolean'],
        ];
    }
}
