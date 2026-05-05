<?php

namespace App\Domains\Settings\Data;

use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class UpdateTeamThemeData extends Data
{
    public function __construct(
        #[Nullable, StringType, Max(255)]
        public readonly ?string $theme = null,
    ) {}
}
