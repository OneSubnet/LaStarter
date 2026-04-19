<?php

namespace Modules\Spaces\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSpaceRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'visibility' => ['sometimes', 'string', 'in:public,restricted,private'],
        ];
    }
}
