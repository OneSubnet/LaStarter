<?php

namespace Modules\Lms\Data\Enrollment;

use Modules\Lms\Models\Enrollment;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class EnrollmentRowData extends Data
{
    public function __construct(
        public readonly int $id,
        public readonly int $course_id,
        public readonly ?int $user_id,
        public readonly ?string $name,
        public readonly ?string $email,
        public readonly string $role,
        public readonly string $enrolled_at,
        public readonly ?string $completed_at,
        public readonly int $progress,
    ) {}

    public static function fromModel(Enrollment $enrollment): self
    {
        return new self(
            id: $enrollment->id,
            course_id: $enrollment->course_id,
            user_id: $enrollment->user_id,
            name: $enrollment->user?->name ?? $enrollment->name,
            email: $enrollment->user?->email ?? $enrollment->email,
            role: $enrollment->role,
            enrolled_at: $enrollment->enrolled_at->toIso8601String(),
            completed_at: $enrollment->completed_at?->toIso8601String(),
            progress: $enrollment->progress,
        );
    }
}
