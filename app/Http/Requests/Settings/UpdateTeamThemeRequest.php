<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateTeamThemeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', $this->user()->currentTeam);
    }

    public function rules(): array
    {
        return [
            'theme' => ['nullable', 'string', 'max:255'],
        ];
    }
}
