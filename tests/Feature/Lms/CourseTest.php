<?php

use App\Concerns\TeamScope;
use App\Models\User;
use Modules\Lms\Models\Course;
use Tests\Concerns\CreatesTeams;
use Tests\Concerns\WithLms;

uses(CreatesTeams::class, WithLms::class);

beforeEach(function () {
    $this->setupLms();
});

// ──────────────────────────────────────────────
// Instructor (courses.create) can manage courses
// ──────────────────────────────────────────────

test('instructor can view courses list', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);
    $this->givePermission($owner, 'lms.courses.view', $team);

    Course::create([
        'team_id' => $team->id,
        'created_by' => $owner->id,
        'title' => 'Test Course',
        'slug' => 'test-course',
        'status' => 'draft',
    ]);

    setupTeamAuth($owner, $team);

    $response = $this->get(route('lms.courses.index', ['current_team' => $team->slug]));

    $response->assertOk();
});

test('instructor can create a course', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);
    $this->givePermission($owner, 'lms.courses.create', $team);
    $this->givePermission($owner, 'lms.courses.view', $team);

    setupTeamAuth($owner, $team);

    $response = $this->post(route('lms.courses.store', ['current_team' => $team->slug]), [
        'title' => 'New Course',
        'description' => 'Course description',
        'status' => 'draft',
        'certificate_enabled' => true,
        'certificate_threshold' => 80,
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('lms_courses', [
        'team_id' => $team->id,
        'title' => 'New Course',
        'status' => 'draft',
    ]);
});

test('instructor can update a course', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);
    $this->givePermission($owner, 'lms.courses.update', $team);

    setupTeamAuth($owner, $team);

    $course = Course::create([
        'team_id' => $team->id,
        'created_by' => $owner->id,
        'title' => 'Original Title',
        'slug' => 'original-title',
        'status' => 'draft',
    ]);

    $response = $this->put(
        route('lms.courses.update', ['current_team' => $team->slug, 'course' => $course->id]),
        [
            'title' => 'Updated Title',
            'description' => 'Updated description',
            'status' => 'draft',
        ],
    );

    $response->assertRedirect();

    $this->assertDatabaseHas('lms_courses', [
        'id' => $course->id,
        'title' => 'Updated Title',
    ]);
});

test('instructor can delete a course', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);
    $this->givePermission($owner, 'lms.courses.delete', $team);

    setupTeamAuth($owner, $team);

    $course = Course::create([
        'team_id' => $team->id,
        'created_by' => $owner->id,
        'title' => 'Course to Delete',
        'slug' => 'course-to-delete',
        'status' => 'draft',
    ]);

    $response = $this->delete(
        route('lms.courses.destroy', ['current_team' => $team->slug, 'course' => $course->id]),
    );

    $response->assertRedirect();

    $this->assertSoftDeleted('lms_courses', [
        'id' => $course->id,
    ]);
});

test('instructor can publish a course', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);
    $this->givePermission($owner, 'lms.courses.publish', $team);

    setupTeamAuth($owner, $team);

    $course = Course::create([
        'team_id' => $team->id,
        'created_by' => $owner->id,
        'title' => 'Course to Publish',
        'slug' => 'course-to-publish',
        'status' => 'draft',
    ]);

    $response = $this->post(
        route('lms.courses.publish', ['current_team' => $team->slug, 'course' => $course->id]),
    );

    $response->assertRedirect();

    $this->assertDatabaseHas('lms_courses', [
        'id' => $course->id,
        'status' => 'published',
    ]);
});

test('instructor can view a course detail', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);
    $this->givePermission($owner, 'lms.courses.view', $team);

    setupTeamAuth($owner, $team);

    $course = Course::create([
        'team_id' => $team->id,
        'created_by' => $owner->id,
        'title' => 'Course Detail',
        'slug' => 'course-detail',
        'status' => 'draft',
    ]);

    $response = $this->get(
        route('lms.courses.show', ['current_team' => $team->slug, 'course' => $course->id]),
    );

    $response->assertOk();
});

test('instructor can view course edit page', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);
    $this->givePermission($owner, 'lms.courses.update', $team);

    setupTeamAuth($owner, $team);

    $course = Course::create([
        'team_id' => $team->id,
        'created_by' => $owner->id,
        'title' => 'Course Edit',
        'slug' => 'course-edit',
        'status' => 'draft',
    ]);

    $response = $this->get(
        route('lms.courses.edit', ['current_team' => $team->slug, 'course' => $course->id]),
    );

    $response->assertOk();
});

// ──────────────────────────────────────────────
// Learner (courses.learn only) cannot manage courses
// ──────────────────────────────────────────────

test('learner cannot create courses', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);
    $this->givePermission($learner, 'lms.courses.learn', $team);

    setupTeamAuth($learner, $team);

    $response = $this->post(route('lms.courses.store', ['current_team' => $team->slug]), [
        'title' => 'Unauthorized Course',
        'status' => 'draft',
    ]);

    $response->assertForbidden();

    $this->assertDatabaseMissing('lms_courses', [
        'title' => 'Unauthorized Course',
    ]);
});

test('learner cannot update courses', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);

    $course = Course::create([
        'team_id' => $team->id,
        'created_by' => $owner->id,
        'title' => 'Protected Course',
        'slug' => 'protected-course',
        'status' => 'draft',
    ]);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);
    $this->givePermission($learner, 'lms.courses.learn', $team);

    setupTeamAuth($learner, $team);

    $response = $this->put(
        route('lms.courses.update', ['current_team' => $team->slug, 'course' => $course->id]),
        ['title' => 'Hacked Title', 'status' => 'draft'],
    );

    $response->assertForbidden();

    $this->assertDatabaseHas('lms_courses', [
        'id' => $course->id,
        'title' => 'Protected Course',
    ]);
});

test('learner cannot delete courses', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);

    $course = Course::create([
        'team_id' => $team->id,
        'created_by' => $owner->id,
        'title' => 'Protected Course',
        'slug' => 'protected-course',
        'status' => 'draft',
    ]);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);
    $this->givePermission($learner, 'lms.courses.learn', $team);

    setupTeamAuth($learner, $team);

    $response = $this->delete(
        route('lms.courses.destroy', ['current_team' => $team->slug, 'course' => $course->id]),
    );

    $response->assertForbidden();

    $this->assertDatabaseHas('lms_courses', [
        'id' => $course->id,
        'deleted_at' => null,
    ]);
});

test('learner cannot publish courses', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);

    $course = Course::create([
        'team_id' => $team->id,
        'created_by' => $owner->id,
        'title' => 'Draft Course',
        'slug' => 'draft-course',
        'status' => 'draft',
    ]);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);
    $this->givePermission($learner, 'lms.courses.learn', $team);

    setupTeamAuth($learner, $team);

    $response = $this->post(
        route('lms.courses.publish', ['current_team' => $team->slug, 'course' => $course->id]),
    );

    $response->assertForbidden();

    $this->assertDatabaseHas('lms_courses', [
        'id' => $course->id,
        'status' => 'draft',
    ]);
});

// ──────────────────────────────────────────────
// Guest cannot access courses
// ──────────────────────────────────────────────

test('guest cannot access courses list', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);

    $response = $this->get(route('lms.courses.index', ['current_team' => $team->slug]));

    $response->assertRedirect(route('login'));
});

test('guest cannot create a course', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);

    $response = $this->post(route('lms.courses.store', ['current_team' => $team->slug]), [
        'title' => 'Guest Course',
        'status' => 'draft',
    ]);

    $response->assertRedirect(route('login'));
});

// ──────────────────────────────────────────────
// Team isolation
// ──────────────────────────────────────────────

test('instructor cannot access courses from another team', function () {
    [$ownerA, $teamA] = $this->createTeamWithOwner('Team A');
    [$ownerB, $teamB] = $this->createTeamWithOwner('Team B');
    $this->enableLmsForTeam($teamA->id);
    $this->enableLmsForTeam($teamB->id);

    $this->givePermission($ownerA, 'lms.courses.view', $teamA);

    Course::create([
        'team_id' => $teamB->id,
        'created_by' => $ownerB->id,
        'title' => 'Team B Course',
        'slug' => 'team-b-course',
        'status' => 'draft',
    ]);

    setupTeamAuth($ownerA, $teamA);

    $courseB = Course::withoutGlobalScope(TeamScope::class)
        ->where('team_id', $teamB->id)
        ->first();

    $response = $this->get(
        route('lms.courses.show', ['current_team' => $teamA->slug, 'course' => $courseB->id]),
    );

    // Should be 404 due to global scope or 403 due to team membership
    $response->assertStatus(404);
});
