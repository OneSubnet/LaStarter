<?php

namespace App\Domains\Team\Data;

use App\Domains\Cms\DataToModel;
use App\Models\Team;
use App\Rules\TeamName;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\Validator;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class TeamRequestData extends Data implements DataToModel
{
    public function __construct(
        #[Required, Max(255)]
        public readonly string $name,
        #[Nullable]
        public readonly ?bool $isPersonal = null,
    ) {}

    /**
     * Custom validation for team name.
     */
    public static function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $data = $validator->getData();
            $name = $data['name'] ?? null;
            if ($name !== null) {
                $rule = new TeamName;
                $fail = fn (string $message) => $validator->errors()->add('name', $message);

                $rule->validate('name', $name, $fail);
            }
        });
    }

    public function toModel(Model $model): Model
    {
        assert($model instanceof Team);

        $model->fill([
            'name' => $this->name,
            'is_personal' => $this->isPersonal ?? false,
        ]);

        return $model;
    }
}
