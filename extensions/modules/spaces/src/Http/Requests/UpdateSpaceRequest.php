<?php

namespace Modules\Spaces\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSpaceRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'visibility' => ['sometimes', 'string', 'in:public,restricted,private'],
        ];
    }
}
