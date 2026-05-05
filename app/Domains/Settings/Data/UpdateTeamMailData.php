<?php

namespace App\Domains\Settings\Data;

use Spatie\LaravelData\Attributes\Validation\Between;
use Spatie\LaravelData\Attributes\Validation\Email;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class UpdateTeamMailData extends Data
{
    public function __construct(
        #[Required, StringType, Max(255)]
        public readonly string $host,
        #[Required, IntegerType, Between(1, 65535)]
        public readonly int $port,
        #[Nullable, StringType, Max(255)]
        public readonly ?string $username,
        #[Nullable, StringType, Max(255)]
        public readonly ?string $password,
        #[Required, StringType]
        #[In(['tls', 'ssl', 'none'])]
        public readonly string $encryption,
        #[Nullable, Email, Max(255)]
        public readonly ?string $fromAddress = null,
        #[Nullable, StringType, Max(255)]
        public readonly ?string $fromName = null,
    ) {}
}
