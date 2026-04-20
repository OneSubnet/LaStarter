<?php

namespace App\Http\Requests\Teams;

use App\Models\TeamInvitation;
use App\Rules\ValidTeamInvitation;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class AcceptTeamInvitationRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'invitation' => ['required', new ValidTeamInvitation($this->user())],
        ];
    }

    /**
     * Get the validation data from the request.
     */
    public function validationData(): array
    {
        $code = $this->route('invitation_code');

        return array_merge(parent::validationData(), [
            'invitation' => TeamInvitation::where('code', $code)->first(),
        ]);
    }
}
