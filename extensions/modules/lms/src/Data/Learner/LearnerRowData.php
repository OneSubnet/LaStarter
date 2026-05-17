<?php

namespace Modules\Lms\Data\Learner;

use App\Models\User;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class LearnerRowData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly string $name,
        public readonly string $email,
        public readonly int $enrollments_count,
        public readonly ?string $created_at,
    ) {}

    public static function fromModel(User $user, int $enrollmentsCount = 0): self
    {
        return new self(
            id: $user->id,
            name: $user->name,
            email: $user->email,
            enrollments_count: $enrollmentsCount,
            created_at: $user->created_at?->toIso8601String(),
        );
    }
}
