<?php

namespace App\Http\Requests\Teams;

use App\Enums\TeamRole;
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
        $teamId = $this->route('current_team')?->id;

        return [
            'role' => ['required', 'string', Rule::in(
                Role::where('team_id', $teamId)
                    ->where('name', '!=', TeamRole::Owner->value)
                    ->pluck('name')
                    ->toArray()
            )],
        ];
    }
}
