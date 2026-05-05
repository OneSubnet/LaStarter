<?php

namespace App\Domains\Team\Data;

use App\Models\Team;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class TeamRowData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly string $name,
        public readonly string $slug,
        public readonly bool $isPersonal,
        public readonly bool $isCurrent,
    ) {}

    public static function fromModel(Team $team, bool $isCurrent = false): self
    {
        return new self(
            id: $team->id,
            name: $team->name,
            slug: $team->slug,
            isPersonal: $team->is_personal,
            isCurrent: $isCurrent,
        );
    }
}
