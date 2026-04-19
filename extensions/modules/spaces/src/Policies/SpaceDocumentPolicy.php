<?php

namespace Modules\Spaces\Policies;

use App\Models\User;
use Modules\Spaces\Models\SpaceDocument;

class SpaceDocumentPolicy
{
    public function view(User $user, SpaceDocument $document): bool
    {
        return $user->hasPermissionTo('document.view');
    }

    public function upload(User $user, SpaceDocument $document): bool
    {
        return $user->hasPermissionTo('document.upload');
    }

    public function delete(User $user, SpaceDocument $document): bool
    {
        return $user->hasPermissionTo('document.delete');
    }

    public function requestSignature(User $user, SpaceDocument $document): bool
    {
        return $user->hasPermissionTo('document.request-signature');
    }

    public function sign(User $user, SpaceDocument $document): bool
    {
        return $user->hasPermissionTo('document.sign');
    }
}
