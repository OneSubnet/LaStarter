<?php

namespace Modules\Projects\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProjectRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'string', 'in:active,archived,completed'],
            'priority' => ['sometimes', 'string', 'in:low,medium,high'],
            'due_date' => ['sometimes', 'nullable', 'date'],
            'color' => ['sometimes', 'nullable', 'string', 'max:7'],
        ];
    }
}
