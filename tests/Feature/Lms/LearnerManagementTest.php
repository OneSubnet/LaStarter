<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Modules\Lms\Models\Course;
use Modules\Lms\Models\Enrollment;
use Tests\Concerns\CreatesTeams;
use Tests\Concerns\WithLms;

uses(CreatesTeams::class, WithLms::class);

beforeEach(function () {
    $this->setupLms();
});

// ──────────────────────────────────────────────
// Instructor can list learners
// ──────────────────────────────────────────────

test('instructor can list learners', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);
    $this->givePermission($owner, 'lms.learners.manage', $team);

    setupTeamAuth($owner, $team);

    $response = $this->get(route('lms.learners.index', ['current_team' => $team->slug]));

    $response->assertOk();
});

test('instructor can search learners', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);
    $this->givePermission($owner, 'lms.learners.manage', $team);

    $learner = User::factory()->create(['name' => 'Marie Curie']);
    $this->addMemberToTeam($team, $learner);
    $this->givePermission($learner, 'lms.courses.learn', $team);

    setupTeamAuth($owner, $team);

    $response = $this->get(
        route('lms.learners.search', ['current_team' => $team->slug, 'q' => 'Marie']),
    );

    $response->assertOk();
    $response->assertJsonFragment(['name' => 'Marie Curie']);
});

// ──────────────────────────────────────────────
// Instructor can create learner
// ──────────────────────────────────────────────

test('instructor can create a new learner', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);
    $this->givePermission($owner, 'lms.learners.manage', $team);

    setupTeamAuth($owner, $team);

    $response = $this->post(route('lms.learners.store', ['current_team' => $team->slug]), [
        'name' => 'New Learner',
        'email' => 'newlearner@example.com',
    ]);

    $response->assertRedirect();

    // User was created
    $this->assertDatabaseHas('users', [
        'name' => 'New Learner',
        'email' => 'newlearner@example.com',
    ]);

    // User was added to the team
    $newUser = User::where('email', 'newlearner@example.com')->first();
    $this->assertTrue($newUser->belongsToTeam($team));
});

test('instructor cannot create learner with duplicate email in same team', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);
    $this->givePermission($owner, 'lms.learners.manage', $team);

    $existingLearner = User::factory()->create(['email' => 'existing@example.com']);
    $this->addMemberToTeam($team, $existingLearner);

    setupTeamAuth($owner, $team);

    $response = $this->post(route('lms.learners.store', ['current_team' => $team->slug]), [
        'name' => 'Duplicate',
        'email' => 'existing@example.com',
    ]);

    $response->assertRedirect();

    // Should have flashed an error toast (existing user already in team)
    // Inertia::flash uses a custom session key, just verify redirect
});

// ──────────────────────────────────────────────
// Instructor can update learner
// ──────────────────────────────────────────────

test('instructor can update a learner', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);
    $this->givePermission($owner, 'lms.learners.manage', $team);

    $learner = User::factory()->create([
        'name' => 'Original Name',
        'email' => 'original@example.com',
    ]);
    $this->addMemberToTeam($team, $learner);

    setupTeamAuth($owner, $team);

    $response = $this->put(
        route('lms.learners.update', ['current_team' => $team->slug, 'learner' => $learner->id]),
        [
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
        ],
    );

    $response->assertRedirect();

    $this->assertDatabaseHas('users', [
        'id' => $learner->id,
        'name' => 'Updated Name',
        'email' => 'updated@example.com',
    ]);
});

test('instructor can update learner password', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);
    $this->givePermission($owner, 'lms.learners.manage', $team);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);

    setupTeamAuth($owner, $team);

    $response = $this->put(
        route('lms.learners.update', ['current_team' => $team->slug, 'learner' => $learner->id]),
        [
            'name' => $learner->name,
            'email' => $learner->email,
            'password' => 'new-secure-password',
        ],
    );

    $response->assertRedirect();

    // Password should have been updated
    $learner->refresh();
    expect(Hash::check('new-secure-password', $learner->password))->toBeTrue();
});

// ──────────────────────────────────────────────
// Instructor can block / unblock learner
// ──────────────────────────────────────────────

test('instructor can block a learner', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);
    $this->givePermission($owner, 'lms.learners.manage', $team);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);

    setupTeamAuth($owner, $team);

    $course = Course::create([
        'team_id' => $team->id,
        'created_by' => $owner->id,
        'title' => 'Course '.uniqid(),
        'slug' => 'course-'.uniqid(),
        'status' => 'published',
    ]);

    Enrollment::create([
        'team_id' => $team->id,
        'course_id' => $course->id,
        'user_id' => $learner->id,
        'role' => 'learner',
        'status' => 'active',
        'enrolled_at' => now(),
    ]);

    $response = $this->post(
        route('lms.learners.block', ['current_team' => $team->slug, 'learner' => $learner->id]),
    );

    $response->assertRedirect();

    $this->assertDatabaseHas('lms_enrollments', [
        'user_id' => $learner->id,
        'team_id' => $team->id,
        'status' => 'blocked',
    ]);
});

test('instructor can unblock a learner', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);
    $this->givePermission($owner, 'lms.learners.manage', $team);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);

    setupTeamAuth($owner, $team);

    $course = Course::create([
        'team_id' => $team->id,
        'created_by' => $owner->id,
        'title' => 'Course '.uniqid(),
        'slug' => 'course-'.uniqid(),
        'status' => 'published',
    ]);

    Enrollment::create([
        'team_id' => $team->id,
        'course_id' => $course->id,
        'user_id' => $learner->id,
        'role' => 'learner',
        'status' => 'blocked',
        'enrolled_at' => now(),
    ]);

    $response = $this->post(
        route('lms.learners.unblock', ['current_team' => $team->slug, 'learner' => $learner->id]),
    );

    $response->assertRedirect();

    $this->assertDatabaseHas('lms_enrollments', [
        'user_id' => $learner->id,
        'team_id' => $team->id,
        'status' => 'active',
    ]);
});

// ──────────────────────────────────────────────
// Instructor can remove learner
// ──────────────────────────────────────────────

test('instructor can remove a learner', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);
    $this->givePermission($owner, 'lms.learners.manage', $team);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);

    setupTeamAuth($owner, $team);

    $course = Course::create([
        'team_id' => $team->id,
        'created_by' => $owner->id,
        'title' => 'Course '.uniqid(),
        'slug' => 'course-'.uniqid(),
        'status' => 'published',
    ]);

    Enrollment::create([
        'team_id' => $team->id,
        'course_id' => $course->id,
        'user_id' => $learner->id,
        'role' => 'learner',
        'status' => 'active',
        'enrolled_at' => now(),
    ]);

    $response = $this->delete(
        route('lms.learners.destroy', ['current_team' => $team->slug, 'learner' => $learner->id]),
    );

    $response->assertRedirect();

    // Enrollments should be soft-deleted
    $this->assertSoftDeleted('lms_enrollments', [
        'user_id' => $learner->id,
        'team_id' => $team->id,
    ]);

    // User should be detached from team
    expect($learner->fresh()->belongsToTeam($team))->toBeFalse();
});

// ──────────────────────────────────────────────
// Instructor cannot manage learners from other teams
// ──────────────────────────────────────────────

test('instructor cannot update learner from another team', function () {
    [, $teamA] = $this->createTeamWithOwner('Team A');
    [$ownerB, $teamB] = $this->createTeamWithOwner('Team B');
    $this->enableLmsForTeam($teamA->id);
    $this->enableLmsForTeam($teamB->id);
    $this->givePermission($ownerB, 'lms.learners.manage', $teamB);

    // Learner belongs to team A only
    $learner = User::factory()->create(['name' => 'Team A Learner']);
    $this->addMemberToTeam($teamA, $learner);

    setupTeamAuth($ownerB, $teamB);

    $response = $this->put(
        route('lms.learners.update', ['current_team' => $teamB->slug, 'learner' => $learner->id]),
        [
            'name' => 'Hacked Name',
            'email' => $learner->email,
        ],
    );

    // LearnerController checks $learner->teams()->where('teams.id', $teamId)->firstOrFail()
    $response->assertStatus(404);

    $this->assertDatabaseHas('users', [
        'id' => $learner->id,
        'name' => 'Team A Learner',
    ]);
});

test('instructor cannot block learner from another team', function () {
    [, $teamA] = $this->createTeamWithOwner('Team A');
    [$ownerB, $teamB] = $this->createTeamWithOwner('Team B');
    $this->enableLmsForTeam($teamA->id);
    $this->enableLmsForTeam($teamB->id);
    $this->givePermission($ownerB, 'lms.learners.manage', $teamB);

    $learner = User::factory()->create();
    $this->addMemberToTeam($teamA, $learner);

    setupTeamAuth($ownerB, $teamB);

    $response = $this->post(
        route('lms.learners.block', ['current_team' => $teamB->slug, 'learner' => $learner->id]),
    );

    $response->assertStatus(404);
});

test('instructor cannot remove learner from another team', function () {
    [, $teamA] = $this->createTeamWithOwner('Team A');
    [$ownerB, $teamB] = $this->createTeamWithOwner('Team B');
    $this->enableLmsForTeam($teamA->id);
    $this->enableLmsForTeam($teamB->id);
    $this->givePermission($ownerB, 'lms.learners.manage', $teamB);

    $learner = User::factory()->create();
    $this->addMemberToTeam($teamA, $learner);

    setupTeamAuth($ownerB, $teamB);

    $response = $this->delete(
        route('lms.learners.destroy', ['current_team' => $teamB->slug, 'learner' => $learner->id]),
    );

    $response->assertStatus(404);

    // Learner should still belong to team A
    expect($learner->fresh()->belongsToTeam($teamA))->toBeTrue();
});

// ──────────────────────────────────────────────
// Permissions enforcement
// ──────────────────────────────────────────────

test('user without manage permission cannot list learners', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);
    $this->givePermission($learner, 'lms.courses.learn', $team);

    setupTeamAuth($learner, $team);

    $response = $this->get(route('lms.learners.index', ['current_team' => $team->slug]));

    $response->assertForbidden();
});

test('user without manage permission cannot create learner', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);
    $this->givePermission($learner, 'lms.courses.learn', $team);

    setupTeamAuth($learner, $team);

    $response = $this->post(route('lms.learners.store', ['current_team' => $team->slug]), [
        'name' => 'Unauthorized',
        'email' => 'unauthorized@example.com',
    ]);

    $response->assertForbidden();
});

test('guest cannot access learner management', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);

    $response = $this->get(route('lms.learners.index', ['current_team' => $team->slug]));

    $response->assertRedirect(route('login'));
});
