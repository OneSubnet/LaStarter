<?php

namespace App\Domains\User\Data;

use App\Models\User;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class UserFormData extends Data
{
    public function __construct(
        public readonly ?int $id = null,
        #[Max(255)]
        public readonly string $name = '',
        #[Max(255)]
        public readonly string $email = '',
        public readonly string $locale = 'en',
        public readonly ?int $onboardingStep = null,
        public readonly bool $onboardingCompleted = false,
        #[Nullable]
        public readonly ?int $currentTeamId = null,
    ) {}

    public static function fromModel(User $user): self
    {
        return new self(
            id: $user->id,
            name: $user->name,
            email: $user->email,
            locale: $user->locale,
            onboardingStep: $user->onboarding_step,
            onboardingCompleted: (bool) $user->onboarding_completed,
            currentTeamId: $user->current_team_id,
        );
    }
}
