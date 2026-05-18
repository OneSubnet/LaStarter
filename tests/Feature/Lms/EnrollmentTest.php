<?php

use App\Models\User;
use Modules\Lms\Models\Course;
use Modules\Lms\Models\Enrollment;
use Tests\Concerns\CreatesTeams;
use Tests\Concerns\WithLms;

uses(CreatesTeams::class, WithLms::class);

beforeEach(function () {
    $this->setupLms();
});

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function createCourseForTeam($team, $owner): Course
{
    return Course::create([
        'team_id' => $team->id,
        'created_by' => $owner->id,
        'title' => 'Test Course '.uniqid(),
        'slug' => 'test-course-'.uniqid(),
        'status' => 'published',
    ]);
}

// ──────────────────────────────────────────────
// Instructor can manage enrollments
// ──────────────────────────────────────────────

test('instructor can enroll a learner', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);
    $this->givePermission($owner, 'lms.courses.manage_learners', $team);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);
    $this->givePermission($learner, 'lms.courses.learn', $team);

    setupTeamAuth($owner, $team);

    $course = createCourseForTeam($team, $owner);

    $response = $this->post(
        route('lms.courses.enrollments.store', ['current_team' => $team->slug, 'course' => $course->id]),
        [
            'user_id' => $learner->id,
            'role' => 'learner',
        ],
    );

    $response->assertRedirect();

    $this->assertDatabaseHas('lms_enrollments', [
        'course_id' => $course->id,
        'user_id' => $learner->id,
        'role' => 'learner',
        'team_id' => $team->id,
    ]);
});

test('instructor can list enrollments for a course', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);
    $this->givePermission($owner, 'lms.courses.manage_learners', $team);

    setupTeamAuth($owner, $team);

    $course = createCourseForTeam($team, $owner);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);

    Enrollment::create([
        'team_id' => $team->id,
        'course_id' => $course->id,
        'user_id' => $learner->id,
        'role' => 'learner',
        'status' => 'active',
        'enrolled_at' => now(),
    ]);

    $response = $this->get(
        route('lms.courses.enrollments.index', ['current_team' => $team->slug, 'course' => $course->id]),
    );

    $response->assertOk();
    $response->assertJsonStructure(['*' => ['id', 'user_id', 'course_id', 'role']]);
});

test('instructor can remove an enrollment', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);
    $this->givePermission($owner, 'lms.courses.manage_learners', $team);

    setupTeamAuth($owner, $team);

    $course = createCourseForTeam($team, $owner);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);

    $enrollment = Enrollment::create([
        'team_id' => $team->id,
        'course_id' => $course->id,
        'user_id' => $learner->id,
        'role' => 'learner',
        'status' => 'active',
        'enrolled_at' => now(),
    ]);

    $response = $this->delete(
        route('lms.courses.enrollments.destroy', [
            'current_team' => $team->slug,
            'course' => $course->id,
            'enrollment' => $enrollment->id,
        ]),
    );

    $response->assertRedirect();

    $this->assertSoftDeleted('lms_enrollments', [
        'id' => $enrollment->id,
    ]);
});

test('instructor can search users for enrollment', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);
    $this->givePermission($owner, 'lms.courses.manage_learners', $team);

    $learner = User::factory()->create(['name' => 'Jean Dupont']);
    $this->addMemberToTeam($team, $learner);

    setupTeamAuth($owner, $team);

    $course = createCourseForTeam($team, $owner);

    $response = $this->get(
        route('lms.courses.enrollments.search', ['current_team' => $team->slug, 'course' => $course->id, 'q' => 'Jean']),
    );

    $response->assertOk();
    $response->assertJsonFragment(['name' => 'Jean Dupont']);
});

test('enrolling same learner twice is rejected', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);
    $this->givePermission($owner, 'lms.courses.manage_learners', $team);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);

    setupTeamAuth($owner, $team);

    $course = createCourseForTeam($team, $owner);

    // First enrollment
    Enrollment::create([
        'team_id' => $team->id,
        'course_id' => $course->id,
        'user_id' => $learner->id,
        'role' => 'learner',
        'status' => 'active',
        'enrolled_at' => now(),
    ]);

    // Attempt duplicate
    $response = $this->post(
        route('lms.courses.enrollments.store', ['current_team' => $team->slug, 'course' => $course->id]),
        [
            'user_id' => $learner->id,
            'role' => 'learner',
        ],
    );

    $response->assertRedirect();

    // Only one enrollment should exist
    expect(
        Enrollment::where('course_id', $course->id)
            ->where('user_id', $learner->id)
            ->count()
    )->toBe(1);
});

// ──────────────────────────────────────────────
// Learner cannot manage enrollments
// ──────────────────────────────────────────────

test('learner cannot enroll others', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);
    $this->givePermission($learner, 'lms.courses.learn', $team);

    $otherUser = User::factory()->create();
    $this->addMemberToTeam($team, $otherUser);

    setupTeamAuth($learner, $team);

    $course = createCourseForTeam($team, $owner);

    $response = $this->post(
        route('lms.courses.enrollments.store', ['current_team' => $team->slug, 'course' => $course->id]),
        [
            'user_id' => $otherUser->id,
            'role' => 'learner',
        ],
    );

    $response->assertForbidden();
});

test('learner cannot access enrollment management', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);

    $course = createCourseForTeam($team, $owner);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);
    $this->givePermission($learner, 'lms.courses.learn', $team);

    setupTeamAuth($learner, $team);

    $response = $this->get(
        route('lms.courses.enrollments.index', ['current_team' => $team->slug, 'course' => $course->id]),
    );

    $response->assertForbidden();
});

// ──────────────────────────────────────────────
// Enrollment creation with new user
// ──────────────────────────────────────────────

test('instructor can enroll by creating a new user', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);
    $this->givePermission($owner, 'lms.courses.manage_learners', $team);

    setupTeamAuth($owner, $team);

    $course = createCourseForTeam($team, $owner);

    $response = $this->post(
        route('lms.courses.enrollments.store', ['current_team' => $team->slug, 'course' => $course->id]),
        [
            'name' => 'New Learner',
            'email' => 'newlearner@example.com',
            'create_user' => true,
            'role' => 'learner',
        ],
    );

    $response->assertRedirect();

    // User was created
    $this->assertDatabaseHas('users', [
        'email' => 'newlearner@example.com',
    ]);

    // Enrollment was created
    $newUser = User::where('email', 'newlearner@example.com')->first();
    $this->assertDatabaseHas('lms_enrollments', [
        'course_id' => $course->id,
        'user_id' => $newUser->id,
        'role' => 'learner',
    ]);
});
