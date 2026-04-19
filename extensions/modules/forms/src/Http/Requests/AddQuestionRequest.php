<?php

namespace Modules\Forms\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AddQuestionRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'type' => ['required', 'string', 'in:text,textarea,email,number,select,radio,checkbox,date,file,rating,scale,yes_no'],
            'label' => ['required', 'string'],
            'description' => ['nullable', 'string'],
            'options' => ['nullable', 'array'],
            'required' => ['sometimes', 'boolean'],
        ];
    }
}
