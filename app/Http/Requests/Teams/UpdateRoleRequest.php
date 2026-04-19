<?php

namespace App\Http\Requests\Teams;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Permission;

class UpdateRoleRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $teamId = $this->route('team')?->id;
        $roleId = $this->route('role')?->id;

        return [
            'name' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('roles')->where(function ($query) use ($teamId) {
                    $query->where('team_id', $teamId)->where('guard_name', 'web');
                })->ignore($roleId),
            ],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['string', Rule::in(Permission::pluck('name')->toArray())],
        ];
    }
}
