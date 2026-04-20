<?php

namespace App\Http\Requests\Teams;

use App\Enums\TeamRole;
use App\Rules\UniqueTeamInvitation;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class CreateTeamInvitationRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $team = $this->route('current_team') ?? $this->user()->currentTeam;
        $teamId = $team?->id;

        return [
            'email' => ['required', 'string', 'email', 'max:255', new UniqueTeamInvitation($team)],
            'role' => ['required', 'string', Rule::in(
                Role::where('team_id', $teamId)
                    ->where('name', '!=', TeamRole::Owner->value)
                    ->pluck('name')
                    ->toArray()
            )],
        ];
    }
}
