<?php

namespace Modules\AilesInvisibles\Policies;

use App\Models\User;
use Modules\AilesInvisibles\Models\PortalDocument;

class PortalDocumentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('ai.document.view');
    }

    public function view(User $user, PortalDocument $document): bool
    {
        return $user->hasPermissionTo('ai.document.view');
    }

    public function upload(User $user): bool
    {
        return $user->hasPermissionTo('ai.document.upload');
    }

    public function delete(User $user, PortalDocument $document): bool
    {
        return $user->hasPermissionTo('ai.document.delete');
    }

    public function assign(User $user, PortalDocument $document): bool
    {
        return $user->hasPermissionTo('ai.document.assign');
    }
}
