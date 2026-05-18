<?php

use App\Models\User;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Modules\Lms\Domain\Enrollment\Events\LearnerEnrolledEvent;
use Modules\Lms\Listeners\NotifyInstructorOnEnrollment;
use Modules\Lms\Mail\LearnerEnrolledMail;
use Modules\Lms\Mail\NewEnrollmentMail;
use Modules\Lms\Mail\PasswordSetupMail;
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

function createEmailTestCourse($team, $owner): Course
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
// EnrollmentController – event dispatch
// ──────────────────────────────────────────────

test('enrollment of new user dispatches learner enrolled event with reset url', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);
    $this->givePermission($owner, 'lms.courses.manage_learners', $team);

    setupTeamAuth($owner, $team);

    $course = createEmailTestCourse($team, $owner);

    Event::fakeFor(function () use ($team, $course) {
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

        Event::assertDispatched(LearnerEnrolledEvent::class, function (LearnerEnrolledEvent $event) {
            return $event->isNewUser === true
                && $event->resetUrl !== null
                && str_contains($event->resetUrl, 'reset-password');
        });
    }, [LearnerEnrolledEvent::class]);
});

test('enrollment of existing user dispatches event without password', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);
    $this->givePermission($owner, 'lms.courses.manage_learners', $team);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);

    setupTeamAuth($owner, $team);

    $course = createEmailTestCourse($team, $owner);

    Event::fakeFor(function () use ($team, $course, $learner) {
        $response = $this->post(
            route('lms.courses.enrollments.store', ['current_team' => $team->slug, 'course' => $course->id]),
            [
                'user_id' => $learner->id,
                'role' => 'learner',
            ],
        );

        $response->assertRedirect();

        Event::assertDispatched(LearnerEnrolledEvent::class, function (LearnerEnrolledEvent $event) {
            return $event->isNewUser === false
                && $event->resetUrl === null;
        });
    }, [LearnerEnrolledEvent::class]);
});

// ──────────────────────────────────────────────
// LearnerController – password setup mail
// ──────────────────────────────────────────────

test('learner creation sends password setup mail', function () {
    Mail::fake();

    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);
    $this->givePermission($owner, 'lms.learners.manage', $team);

    setupTeamAuth($owner, $team);

    $response = $this->post(route('lms.learners.store', ['current_team' => $team->slug]), [
        'name' => 'Fresh Learner',
        'email' => 'fresh@example.com',
    ]);

    $response->assertRedirect();

    $newUser = User::where('email', 'fresh@example.com')->first();
    expect($newUser)->not->toBeNull();

    Mail::assertQueued(PasswordSetupMail::class, function (PasswordSetupMail $mail) use ($newUser) {
        $resetUrl = (fn () => $this->resetUrl)->call($mail);

        return $mail->hasTo($newUser->email)
            && str_contains($resetUrl, 'reset-password');
    });
});

// ──────────────────────────────────────────────
// NotifyInstructorOnEnrollment listener
// ──────────────────────────────────────────────

test('enrollment listener sends enrolled mail with password', function () {
    Mail::fake();

    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);

    $learner = User::factory()->create(['name' => 'Alice Learner']);
    $this->addMemberToTeam($team, $learner);

    $course = createEmailTestCourse($team, $owner);

    $enrollment = Enrollment::create([
        'team_id' => $team->id,
        'course_id' => $course->id,
        'user_id' => $learner->id,
        'role' => 'learner',
        'status' => 'active',
        'enrolled_at' => now(),
    ]);

    $resetUrl = url(route('password.reset', [
        'token' => Password::createToken($learner),
        'email' => $learner->email,
    ], absolute: false));

    $event = new LearnerEnrolledEvent($enrollment, isNewUser: true, resetUrl: $resetUrl);

    (new NotifyInstructorOnEnrollment)->handle($event);

    Mail::assertQueued(LearnerEnrolledMail::class, function (LearnerEnrolledMail $mail) use ($learner, $resetUrl) {
        $mailResetUrl = (fn () => $this->resetUrl)->call($mail);

        return $mail->hasTo($learner->email)
            && $mailResetUrl === $resetUrl;
    });
});

test('enrollment listener notifies instructor', function () {
    Mail::fake();

    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);

    $learner = User::factory()->create(['name' => 'Bob Learner']);
    $this->addMemberToTeam($team, $learner);

    $course = createEmailTestCourse($team, $owner);

    $enrollment = Enrollment::create([
        'team_id' => $team->id,
        'course_id' => $course->id,
        'user_id' => $learner->id,
        'role' => 'learner',
        'status' => 'active',
        'enrolled_at' => now(),
    ]);

    $event = new LearnerEnrolledEvent($enrollment, isNewUser: false, resetUrl: null);

    (new NotifyInstructorOnEnrollment)->handle($event);

    Mail::assertQueued(NewEnrollmentMail::class, function (NewEnrollmentMail $mail) use ($owner) {
        return $mail->hasTo($owner->email);
    });
});
