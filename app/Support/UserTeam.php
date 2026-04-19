<?php

namespace App\Support;

readonly class UserTeam
{
    public function __construct(
        public int $id,
        public string $name,
        public string $slug,
        public bool $isPersonal,
        public ?string $role = null,
        public ?string $roleLabel = null,
        public ?bool $isCurrent = null,
    ) {
        //
    }
}
