<?php

namespace Modules\Forms\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitFormRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'responses' => ['required', 'array'],
        ];
    }
}
