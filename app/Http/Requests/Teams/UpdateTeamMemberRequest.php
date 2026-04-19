<?php

namespace App\Http\Requests\Teams;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class UpdateTeamMemberRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $teamId = $this->route('team')?->id;

        return [
            'role' => ['required', 'string', Rule::in(
                Role::where('team_id', $teamId)
                    ->where('name', '!=', 'owner')
                    ->pluck('name')
                    ->toArray()
            )],
        ];
    }
}
