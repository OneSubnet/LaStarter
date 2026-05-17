<?php

namespace Modules\Lms\Data\Enrollment;

use Modules\Lms\Models\Course;
use Modules\Lms\Models\Enrollment;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class EnrollmentRequestData extends Data
{
    public function __construct(
        public readonly int $course_id,
        public readonly ?int $user_id = null,
        public readonly ?string $name = null,
        public readonly ?string $email = null,
        public readonly string $role = 'learner',
    ) {}

    public function toModel(Enrollment $enrollment): Enrollment
    {
        $course = Course::findOrFail($this->course_id);

        $enrollment->fill([
            'team_id' => $course->team_id,
            'course_id' => $this->course_id,
            'user_id' => $this->user_id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'enrolled_at' => now(),
        ]);

        return $enrollment;
    }
}
