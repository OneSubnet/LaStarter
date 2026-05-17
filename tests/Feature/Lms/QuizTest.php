<?php

use App\Models\User;
use Modules\Lms\Models\Course;
use Modules\Lms\Models\CourseSection;
use Modules\Lms\Models\Enrollment;
use Modules\Lms\Models\Lesson;
use Modules\Lms\Models\LessonProgress;
use Modules\Lms\Models\QuizAnswer;
use Modules\Lms\Models\QuizQuestion;
use Modules\Lms\Models\QuizResponse;
use Tests\Concerns\CreatesTeams;
use Tests\Concerns\WithLms;

uses(CreatesTeams::class, WithLms::class);

beforeEach(function () {
    $this->setupLms();
});

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function createCourseWithSectionAndLesson($team, $owner): array
{
    $course = Course::create([
        'team_id' => $team->id,
        'created_by' => $owner->id,
        'title' => 'Quiz Course '.uniqid(),
        'slug' => 'quiz-course-'.uniqid(),
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
        'title' => 'Lesson with Quiz',
        'slug' => 'lesson-with-quiz',
        'content_type' => 'text',
        'sort_order' => 0,
        'is_published' => true,
    ]);

    return [$course, $section, $lesson];
}

function createQuizQuestionWithAnswers(Lesson $lesson): array
{
    $question = QuizQuestion::create([
        'lesson_id' => $lesson->id,
        'question_text' => 'What is the answer?',
        'explanation' => 'Because it is.',
        'sort_order' => 0,
    ]);

    $correctAnswer = QuizAnswer::create([
        'question_id' => $question->id,
        'answer_text' => 'Correct answer',
        'is_correct' => true,
        'sort_order' => 0,
    ]);

    $wrongAnswer = QuizAnswer::create([
        'question_id' => $question->id,
        'answer_text' => 'Wrong answer',
        'is_correct' => false,
        'sort_order' => 1,
    ]);

    return [$question, $correctAnswer, $wrongAnswer];
}

// ──────────────────────────────────────────────
// Instructor creates quiz questions
// ──────────────────────────────────────────────

test('instructor can create quiz question with answers', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);
    $this->givePermission($owner, 'lms.courses.update', $team);

    setupTeamAuth($owner, $team);

    [, , $lesson] = createCourseWithSectionAndLesson($team, $owner);

    $response = $this->post(
        route('lms.lessons.questions.store', ['current_team' => $team->slug, 'lesson' => $lesson->id]),
        [
            'question_text' => 'What is 2+2?',
            'explanation' => 'Basic math',
            'answers' => [
                ['text' => '4', 'is_correct' => true],
                ['text' => '5', 'is_correct' => false],
            ],
        ],
    );

    $response->assertRedirect();

    $this->assertDatabaseHas('lms_quiz_questions', [
        'lesson_id' => $lesson->id,
        'question_text' => 'What is 2+2?',
    ]);

    $question = QuizQuestion::where('lesson_id', $lesson->id)->first();
    expect($question->answers)->toHaveCount(2);
    expect($question->answers->where('is_correct', true))->toHaveCount(1);
});

test('instructor can add an answer to existing question', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);
    $this->givePermission($owner, 'lms.courses.update', $team);

    setupTeamAuth($owner, $team);

    [, , $lesson] = createCourseWithSectionAndLesson($team, $owner);
    [$question] = createQuizQuestionWithAnswers($lesson);

    $response = $this->post(
        route('lms.questions.answers.store', ['current_team' => $team->slug, 'question' => $question->id]),
        [
            'answer_text' => 'Another answer',
            'is_correct' => false,
        ],
    );

    $response->assertRedirect();

    expect($question->fresh()->answers)->toHaveCount(3);
});

test('instructor can delete a quiz question', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);
    $this->givePermission($owner, 'lms.courses.delete', $team);

    setupTeamAuth($owner, $team);

    [, , $lesson] = createCourseWithSectionAndLesson($team, $owner);
    [$question] = createQuizQuestionWithAnswers($lesson);

    $response = $this->delete(
        route('lms.questions.destroy', ['current_team' => $team->slug, 'question' => $question->id]),
    );

    $response->assertRedirect();

    $this->assertDatabaseMissing('lms_quiz_questions', [
        'id' => $question->id,
    ]);
});

// ──────────────────────────────────────────────
// Learner submits quiz responses
// ──────────────────────────────────────────────

test('learner can submit quiz responses', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);
    $this->givePermission($learner, 'lms.courses.learn', $team);

    setupTeamAuth($learner, $team);

    [$course, , $lesson] = createCourseWithSectionAndLesson($team, $owner);
    [$question, $correctAnswer] = createQuizQuestionWithAnswers($lesson);

    $enrollment = Enrollment::create([
        'team_id' => $team->id,
        'course_id' => $course->id,
        'user_id' => $learner->id,
        'role' => 'learner',
        'status' => 'active',
        'enrolled_at' => now(),
    ]);

    LessonProgress::create([
        'enrollment_id' => $enrollment->id,
        'lesson_id' => $lesson->id,
        'status' => 'completed',
        'progress' => LessonProgress::COMPLETION_THRESHOLD,
    ]);

    $response = $this->post(
        route('lms.learn.submit-quiz', [
            'current_team' => $team->slug,
            'course' => $course->id,
            'lesson' => $lesson->id,
        ]),
        [
            'responses' => [
                [
                    'question_id' => $question->id,
                    'answer_id' => $correctAnswer->id,
                ],
            ],
        ],
    );

    $response->assertRedirect();

    $this->assertDatabaseHas('lms_quiz_responses', [
        'enrollment_id' => $enrollment->id,
        'question_id' => $question->id,
        'answer_id' => $correctAnswer->id,
        'is_correct' => true,
    ]);
});

test('quiz submission validates answer belongs to question', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);
    $this->givePermission($learner, 'lms.courses.learn', $team);

    setupTeamAuth($learner, $team);

    [$course, , $lesson] = createCourseWithSectionAndLesson($team, $owner);
    [$question] = createQuizQuestionWithAnswers($lesson);

    // Create a second question with its own answer
    $question2 = QuizQuestion::create([
        'lesson_id' => $lesson->id,
        'question_text' => 'Second question',
        'sort_order' => 1,
    ]);
    $answer2 = QuizAnswer::create([
        'question_id' => $question2->id,
        'answer_text' => 'Answer for question 2',
        'is_correct' => true,
        'sort_order' => 0,
    ]);

    $enrollment = Enrollment::create([
        'team_id' => $team->id,
        'course_id' => $course->id,
        'user_id' => $learner->id,
        'role' => 'learner',
        'status' => 'active',
        'enrolled_at' => now(),
    ]);

    LessonProgress::create([
        'enrollment_id' => $enrollment->id,
        'lesson_id' => $lesson->id,
        'status' => 'completed',
        'progress' => LessonProgress::COMPLETION_THRESHOLD,
    ]);

    // Submit question 1 with answer from question 2
    $response = $this->post(
        route('lms.learn.submit-quiz', [
            'current_team' => $team->slug,
            'course' => $course->id,
            'lesson' => $lesson->id,
        ]),
        [
            'responses' => [
                [
                    'question_id' => $question->id,
                    'answer_id' => $answer2->id,
                ],
            ],
        ],
    );

    $response->assertRedirect();

    // The answer does not belong to the question, so is_correct should be false
    $this->assertDatabaseHas('lms_quiz_responses', [
        'enrollment_id' => $enrollment->id,
        'question_id' => $question->id,
        'answer_id' => $answer2->id,
        'is_correct' => false,
    ]);
});

test('learner cannot submit quiz twice', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);
    $this->givePermission($learner, 'lms.courses.learn', $team);

    setupTeamAuth($learner, $team);

    [$course, , $lesson] = createCourseWithSectionAndLesson($team, $owner);
    [$question, $correctAnswer] = createQuizQuestionWithAnswers($lesson);

    $enrollment = Enrollment::create([
        'team_id' => $team->id,
        'course_id' => $course->id,
        'user_id' => $learner->id,
        'role' => 'learner',
        'status' => 'active',
        'enrolled_at' => now(),
    ]);

    LessonProgress::create([
        'enrollment_id' => $enrollment->id,
        'lesson_id' => $lesson->id,
        'status' => 'completed',
        'progress' => LessonProgress::COMPLETION_THRESHOLD,
    ]);

    // First submission
    $this->post(
        route('lms.learn.submit-quiz', [
            'current_team' => $team->slug,
            'course' => $course->id,
            'lesson' => $lesson->id,
        ]),
        [
            'responses' => [
                ['question_id' => $question->id, 'answer_id' => $correctAnswer->id],
            ],
        ],
    );

    // Second submission (should be rejected)
    $response = $this->post(
        route('lms.learn.submit-quiz', [
            'current_team' => $team->slug,
            'course' => $course->id,
            'lesson' => $lesson->id,
        ]),
        [
            'responses' => [
                ['question_id' => $question->id, 'answer_id' => $correctAnswer->id],
            ],
        ],
    );

    $response->assertRedirect();
    $response->assertSessionHas('toast');

    // Only one response should exist (updateOrCreate does not create duplicates)
    expect(
        QuizResponse::where('enrollment_id', $enrollment->id)
            ->where('question_id', $question->id)
            ->count()
    )->toBe(1);
});

test('quiz submission auto-completes lesson', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);

    $learner = User::factory()->create();
    $this->addMemberToTeam($team, $learner);
    $this->givePermission($learner, 'lms.courses.learn', $team);

    setupTeamAuth($learner, $team);

    [$course, , $lesson] = createCourseWithSectionAndLesson($team, $owner);
    [$question, $correctAnswer] = createQuizQuestionWithAnswers($lesson);

    $enrollment = Enrollment::create([
        'team_id' => $team->id,
        'course_id' => $course->id,
        'user_id' => $learner->id,
        'role' => 'learner',
        'status' => 'active',
        'enrolled_at' => now(),
    ]);

    // No initial lesson progress — quiz submission should create it
    $response = $this->post(
        route('lms.learn.submit-quiz', [
            'current_team' => $team->slug,
            'course' => $course->id,
            'lesson' => $lesson->id,
        ]),
        [
            'responses' => [
                ['question_id' => $question->id, 'answer_id' => $correctAnswer->id],
            ],
        ],
    );

    $response->assertRedirect();

    // Lesson should now be marked as completed (progress >= COMPLETION_THRESHOLD)
    $progress = LessonProgress::where('enrollment_id', $enrollment->id)
        ->where('lesson_id', $lesson->id)
        ->first();

    expect($progress)->not->toBeNull();
    expect($progress->progress)->toBe(LessonProgress::COMPLETION_THRESHOLD);
    expect($progress->status)->toBe('completed');
    expect($progress->completed_at)->not->toBeNull();
});

// ──────────────────────────────────────────────
// Section-level quiz
// ──────────────────────────────────────────────

test('instructor can create section quiz question', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);
    $this->givePermission($owner, 'lms.courses.update', $team);

    setupTeamAuth($owner, $team);

    [$course, $section] = createCourseWithSectionAndLesson($team, $owner);

    $response = $this->post(
        route('lms.courses.sections.questions.store', [
            'current_team' => $team->slug,
            'course' => $course->id,
            'section' => $section->id,
        ]),
        [
            'question_text' => 'Section quiz question?',
            'answers' => [
                ['text' => 'Yes', 'is_correct' => true],
                ['text' => 'No', 'is_correct' => false],
            ],
        ],
    );

    $response->assertRedirect();

    $this->assertDatabaseHas('lms_quiz_questions', [
        'quizable_type' => get_class($section),
        'quizable_id' => $section->id,
        'question_text' => 'Section quiz question?',
    ]);
});

// ──────────────────────────────────────────────
// Learner without learn permission
// ──────────────────────────────────────────────

test('user without learn permission cannot submit quiz', function () {
    [$owner, $team] = $this->createTeamWithOwner('Test Team');
    $this->enableLmsForTeam($team->id);

    $unprivileged = User::factory()->create();
    $this->addMemberToTeam($team, $unprivileged);

    setupTeamAuth($unprivileged, $team);

    [$course, , $lesson] = createCourseWithSectionAndLesson($team, $owner);

    $response = $this->post(
        route('lms.learn.submit-quiz', [
            'current_team' => $team->slug,
            'course' => $course->id,
            'lesson' => $lesson->id,
        ]),
        [
            'responses' => [
                ['question_id' => 1, 'answer_id' => 1],
            ],
        ],
    );

    $response->assertForbidden();
});
