<?php

namespace App\Domains\User\Data;

use App\Domains\Cms\DataToModel;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Spatie\LaravelData\Attributes\Validation\Email;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class UserRequestData extends Data implements DataToModel
{
    public function __construct(
        #[Required, Max(255)]
        public readonly string $name,
        #[Required, Email, Max(255)]
        public readonly string $email,
        #[Nullable]
        public readonly ?string $locale = null,
        #[Nullable]
        public readonly ?int $onboardingStep = null,
        #[Nullable]
        public readonly ?bool $onboardingCompleted = null,
    ) {}

    public function toModel(Model $model): Model
    {
        assert($model instanceof User);

        $model->fill([
            'name' => $this->name,
            'email' => $this->email,
            'locale' => $this->locale,
            'onboarding_step' => $this->onboardingStep,
            'onboarding_completed' => $this->onboardingCompleted,
        ]);

        return $model;
    }
}
