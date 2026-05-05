<?php

namespace App\Domains\Team\Data;

use App\Models\Team;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class TeamFormData extends Data
{
    public function __construct(
        public readonly ?int $id = null,
        #[Max(255)]
        public readonly string $name = '',
        public readonly string $slug = '',
        public readonly bool $isPersonal = false,
    ) {}

    public static function fromModel(Team $team): self
    {
        return new self(
            id: $team->id,
            name: $team->name,
            slug: $team->slug,
            isPersonal: $team->is_personal,
        );
    }
}
