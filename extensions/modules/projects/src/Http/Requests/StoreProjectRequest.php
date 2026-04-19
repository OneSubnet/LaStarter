<?php

namespace Modules\Projects\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProjectRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'priority' => ['sometimes', 'string', 'in:low,medium,high'],
            'due_date' => ['sometimes', 'nullable', 'date'],
            'color' => ['sometimes', 'nullable', 'string', 'max:7'],
        ];
    }
}
