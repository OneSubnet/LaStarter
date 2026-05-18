<?php

use App\Models\User;
use Modules\Lms\Models\Course;
use Modules\Lms\Models\CourseSection;
use Modules\Lms\Models\Enrollment;
use Modules\Lms\Models\Lesson;
use Modules\Lms\Models\LessonProgress;
use Tests\Concerns\CreatesTeams;
use Tests\Concerns\WithLms;

uses(CreatesTeams::class, WithLms::class);

beforeEach(function () {
    $this->setupLms();
});

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function createPublishedCourseWithLesson($team, $owner): array
{
    $course = Course::create([
        'team_id' => $team->id,
        'created_by' => $owner->id,
        'title' => 'Learn Course '.uniqid(),
        'slug' => 'learn-course-'.uniqid(),
        'status' => 'published',
    ]);

    $section = CourseSection::create([
        'course_id' => $course->id,
        'title' => 'Section 1',
        'sort_order' => 0,
        'is_published' => true,
    ]);

    $lesson = Lesson::create([
        'section_id' => $section->id,
        'title' => 'Lesson 1',
        'slug' => 'lesson-1',
        'content_type' => 'text',
        'content' => '# Hello World',
        'sort_order' => 0,
        'is_published' => true,
    ]);

    return [$course, $section, $lesson];
}

// ──────────────────────────────────────────────
// Enrolled learner can access learning content
// ──────────────────────────────────────────────

test('enrolled learner can view course lessons', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);
    $this->givePermission($learner, 'lms.courses.learn', $team);

    setupTeamAuth($learner, $team);

    [$course, , $lesson] = createPublishedCourseWithLesson($team, $owner);

    Enrollment::create([
        'team_id' => $team->id,
        'course_id' => $course->id,
        'user_id' => $learner->id,
        'role' => 'learner',
        'status' => 'active',
        'enrolled_at' => now(),
    ]);

    $response = $this->get(
        route('lms.learn.lesson', [
            'current_team' => $team->slug,
            'course' => $course->id,
            'lesson' => $lesson->id,
        ]),
    );

    $response->assertOk();
});

test('enrolled learner can view learning index', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);
    $this->givePermission($learner, 'lms.courses.learn', $team);

    setupTeamAuth($learner, $team);

    $response = $this->get(route('lms.learn.index', ['current_team' => $team->slug]));

    $response->assertOk();
});

// ──────────────────────────────────────────────
// Blocked learner cannot view lessons
// ──────────────────────────────────────────────

test('blocked learner cannot view lessons', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);
    $this->givePermission($learner, 'lms.courses.learn', $team);

    setupTeamAuth($learner, $team);

    [$course, , $lesson] = createPublishedCourseWithLesson($team, $owner);

    Enrollment::create([
        'team_id' => $team->id,
        'course_id' => $course->id,
        'user_id' => $learner->id,
        'role' => 'learner',
        'status' => 'blocked',
        'enrolled_at' => now(),
    ]);

    $response = $this->get(
        route('lms.learn.lesson', [
            'current_team' => $team->slug,
            'course' => $course->id,
            'lesson' => $lesson->id,
        ]),
    );

    $response->assertForbidden();
});

// ──────────────────────────────────────────────
// Unenrolled user cannot view lessons
// ──────────────────────────────────────────────

test('unenrolled user cannot view lessons', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);
    $this->givePermission($learner, 'lms.courses.learn', $team);

    setupTeamAuth($learner, $team);

    [$course, , $lesson] = createPublishedCourseWithLesson($team, $owner);

    // No enrollment created for this learner

    $response = $this->get(
        route('lms.learn.lesson', [
            'current_team' => $team->slug,
            'course' => $course->id,
            'lesson' => $lesson->id,
        ]),
    );

    // LearningController does firstOrFail() on enrollment → 404
    $response->assertStatus(404);
});

// ──────────────────────────────────────────────
// Progress updates
// ──────────────────────────────────────────────

test('learner progress updates correctly', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);
    $this->givePermission($learner, 'lms.courses.learn', $team);

    setupTeamAuth($learner, $team);

    [$course, , $lesson] = createPublishedCourseWithLesson($team, $owner);

    $enrollment = Enrollment::create([
        'team_id' => $team->id,
        'course_id' => $course->id,
        'user_id' => $learner->id,
        'role' => 'learner',
        'status' => 'active',
        'enrolled_at' => now(),
    ]);

    // Update progress to 500
    $response = $this->post(
        route('lms.learn.update-progress', [
            'current_team' => $team->slug,
            'course' => $course->id,
            'lesson' => $lesson->id,
        ]),
        [
            'progress' => 500,
            'time_spent_seconds' => 30,
            'last_position' => 120,
        ],
    );

    $response->assertOk();
    $response->assertJson(['ok' => true]);

    $progress = LessonProgress::where('enrollment_id', $enrollment->id)
        ->where('lesson_id', $lesson->id)
        ->first();

    expect($progress)->not->toBeNull();
    expect($progress->progress)->toBe(500);
    expect($progress->status)->toBe('in_progress');
    expect($progress->completed_at)->toBeNull();
});

test('learner progress completes at threshold', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);
    $this->givePermission($learner, 'lms.courses.learn', $team);

    setupTeamAuth($learner, $team);

    [$course, , $lesson] = createPublishedCourseWithLesson($team, $owner);

    $enrollment = Enrollment::create([
        'team_id' => $team->id,
        'course_id' => $course->id,
        'user_id' => $learner->id,
        'role' => 'learner',
        'status' => 'active',
        'enrolled_at' => now(),
    ]);

    // Update progress to COMPLETION_THRESHOLD (1000)
    $response = $this->post(
        route('lms.learn.update-progress', [
            'current_team' => $team->slug,
            'course' => $course->id,
            'lesson' => $lesson->id,
        ]),
        [
            'progress' => LessonProgress::COMPLETION_THRESHOLD,
        ],
    );

    $response->assertOk();

    $progress = LessonProgress::where('enrollment_id', $enrollment->id)
        ->where('lesson_id', $lesson->id)
        ->first();

    expect($progress->status)->toBe('completed');
    expect($progress->completed_at)->not->toBeNull();
});

test('completing all lessons updates enrollment progress to 100', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);
    $this->givePermission($learner, 'lms.courses.learn', $team);

    setupTeamAuth($learner, $team);

    [$course, , $lesson] = createPublishedCourseWithLesson($team, $owner);

    $enrollment = Enrollment::create([
        'team_id' => $team->id,
        'course_id' => $course->id,
        'user_id' => $learner->id,
        'role' => 'learner',
        'status' => 'active',
        'enrolled_at' => now(),
    ]);

    // Complete the lesson via the complete endpoint
    $this->post(
        route('lms.learn.complete-lesson', [
            'current_team' => $team->slug,
            'course' => $course->id,
            'lesson' => $lesson->id,
        ]),
    );

    // Enrollment progress should be 100% (1 lesson out of 1 completed)
    $enrollment->refresh();
    expect($enrollment->progress)->toBe(100);
    expect($enrollment->completed_at)->not->toBeNull();
});

// ──────────────────────────────────────────────
// Bookmark
// ──────────────────────────────────────────────

test('learner can bookmark a lesson', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);
    $this->givePermission($learner, 'lms.courses.learn', $team);

    setupTeamAuth($learner, $team);

    [$course, , $lesson] = createPublishedCourseWithLesson($team, $owner);

    Enrollment::create([
        'team_id' => $team->id,
        'course_id' => $course->id,
        'user_id' => $learner->id,
        'role' => 'learner',
        'status' => 'active',
        'enrolled_at' => now(),
    ]);

    // Bookmark (should create progress with is_bookmarked = true)
    $response = $this->post(
        route('lms.learn.bookmark', [
            'current_team' => $team->slug,
            'course' => $course->id,
            'lesson' => $lesson->id,
        ]),
    );

    $response->assertRedirect();

    $this->assertDatabaseHas('lms_lesson_progress', [
        'lesson_id' => $lesson->id,
        'is_bookmarked' => true,
    ]);
});

test('learner can toggle bookmark off', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);
    $this->givePermission($learner, 'lms.courses.learn', $team);

    setupTeamAuth($learner, $team);

    [$course, , $lesson] = createPublishedCourseWithLesson($team, $owner);

    $enrollment = Enrollment::create([
        'team_id' => $team->id,
        'course_id' => $course->id,
        'user_id' => $learner->id,
        'role' => 'learner',
        'status' => 'active',
        'enrolled_at' => now(),
    ]);

    // Create existing progress with bookmark = true
    LessonProgress::create([
        'enrollment_id' => $enrollment->id,
        'lesson_id' => $lesson->id,
        'status' => 'in_progress',
        'progress' => 500,
        'is_bookmarked' => true,
    ]);

    // Toggle bookmark off
    $this->post(
        route('lms.learn.bookmark', [
            'current_team' => $team->slug,
            'course' => $course->id,
            'lesson' => $lesson->id,
        ]),
    );

    $this->assertDatabaseHas('lms_lesson_progress', [
        'lesson_id' => $lesson->id,
        'is_bookmarked' => false,
    ]);
});

// ──────────────────────────────────────────────
// Uncomplete lesson
// ──────────────────────────────────────────────

test('learner can uncomplete a lesson', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);
    $this->givePermission($learner, 'lms.courses.learn', $team);

    setupTeamAuth($learner, $team);

    [$course, , $lesson] = createPublishedCourseWithLesson($team, $owner);

    $enrollment = Enrollment::create([
        'team_id' => $team->id,
        'course_id' => $course->id,
        'user_id' => $learner->id,
        'role' => 'learner',
        'status' => 'active',
        'enrolled_at' => now(),
    ]);

    // Complete the lesson first
    $this->post(
        route('lms.learn.complete-lesson', [
            'current_team' => $team->slug,
            'course' => $course->id,
            'lesson' => $lesson->id,
        ]),
    );

    // Verify it's completed
    $this->assertDatabaseHas('lms_lesson_progress', [
        'enrollment_id' => $enrollment->id,
        'lesson_id' => $lesson->id,
        'status' => 'completed',
    ]);

    // Now uncomplete
    $this->post(
        route('lms.learn.uncomplete-lesson', [
            'current_team' => $team->slug,
            'course' => $course->id,
            'lesson' => $lesson->id,
        ]),
    );

    $this->assertDatabaseHas('lms_lesson_progress', [
        'enrollment_id' => $enrollment->id,
        'lesson_id' => $lesson->id,
        'status' => 'in_progress',
        'progress' => 0,
        'completed_at' => null,
    ]);
});
