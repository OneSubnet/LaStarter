<?php

namespace Modules\Forms\Policies;

use App\Models\User;
use Modules\Forms\Models\FormSubmission;

class FormSubmissionPolicy
{
    public function view(User $user): bool
    {
        return $user->hasPermissionTo('form-submission.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('form-submission.create');
    }

    public function delete(User $user): bool
    {
        return $user->hasPermissionTo('form-submission.delete');
    }
}
