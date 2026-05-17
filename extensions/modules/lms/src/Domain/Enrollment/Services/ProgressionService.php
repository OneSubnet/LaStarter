<?php

namespace Modules\Lms\Domain\Enrollment\Services;

use Modules\Lms\Data\Progress\ProgressData;
use Modules\Lms\Domain\Enrollment\Events\CourseCompletedEvent;
use Modules\Lms\Domain\Enrollment\Events\LessonCompletedEvent;
use Modules\Lms\Models\CourseSection;
use Modules\Lms\Models\Enrollment;
use Modules\Lms\Models\Lesson;
use Modules\Lms\Models\LessonProgress;

/**
 * Progression Service
 *
 * Handles lesson progress tracking and course completion calculation.
 */
class ProgressionService
{
    /**
     * Update or create lesson progress for an enrollment.
     */
    public function updateLessonProgress(
        Enrollment $enrollment,
        Lesson $lesson,
        int $progress,
        ?int $timeSpent = null,
        ?int $lastPosition = null,
    ): LessonProgress {
        $lessonProgress = LessonProgress::updateOrCreate(
            [
                'enrollment_id' => $enrollment->id,
                'lesson_id' => $lesson->id,
            ],
            [
                'progress' => min($progress, LessonProgress::COMPLETION_THRESHOLD),
                'status' => $progress >= LessonProgress::COMPLETION_THRESHOLD ? 'completed' : 'in_progress',
                'completed_at' => $progress >= LessonProgress::COMPLETION_THRESHOLD ? now() : null,
                'last_position' => $lastPosition,
            ],
        );

        if ($timeSpent) {
            $lessonProgress->increment('time_spent_seconds', $timeSpent);
        }

        if ($progress >= LessonProgress::COMPLETION_THRESHOLD) {
            event(new LessonCompletedEvent($lessonProgress, $lesson));
        }

        $this->recalculateCourseProgress($enrollment);

        return $lessonProgress;
    }

    /**
     * Recalculate the overall course progress for an enrollment.
     */
    public function recalculateCourseProgress(Enrollment $enrollment): int
    {
        $course = $enrollment->course()->with('sections.lessons')->firstOrFail();

        $totalLessons = $course->sections->flatMap->lessons->count();

        if ($totalLessons === 0) {
            $enrollment->progress = 0;
            $enrollment->completed_at = null;
            $enrollment->last_accessed_at = now();
            $enrollment->save();

            return 0;
        }

        $completedLessons = LessonProgress::where('enrollment_id', $enrollment->id)
            ->where('status', 'completed')
            ->count();

        $percentage = (int) round(($completedLessons / $totalLessons) * 100);

        $enrollment->progress = $percentage;
        $enrollment->last_accessed_at = now();

        if ($percentage >= 100 && $enrollment->completed_at === null) {
            $enrollment->completed_at = now();

            $autoBlock = $course->settings['auto_block_on_completion'] ?? false;
            if ($autoBlock) {
                $enrollment->status = 'blocked';
            }

            $enrollment->save();

            event(new CourseCompletedEvent($enrollment));
        } else {
            if ($percentage < 100) {
                $enrollment->completed_at = null;
            }
            $enrollment->save();
        }

        return $percentage;
    }

    /**
     * Build a detailed progress breakdown for an enrollment.
     */
    public function getCourseProgress(Enrollment $enrollment): ProgressData
    {
        $course = $enrollment->course()->with('sections.lessons')->firstOrFail();

        $allLessons = $course->sections->flatMap->lessons;
        $totalLessons = $allLessons->count();

        $completedProgress = LessonProgress::where('enrollment_id', $enrollment->id)
            ->where('status', 'completed')
            ->get()
            ->keyBy('lesson_id');

        $completedLessons = $completedProgress->count();
        $progressPercentage = $totalLessons > 0
            ? (int) round(($completedLessons / $totalLessons) * 100)
            : 0;

        $sections = $course->sections->sortBy('sort_order')->map(function (CourseSection $section) use ($completedProgress) {
            $lessons = $section->lessons;
            $total = $lessons->count();
            $completed = $lessons->filter(fn (Lesson $lesson) => $completedProgress->has($lesson->id))->count();

            return [
                'title' => $section->title,
                'completed' => $completed,
                'total' => $total,
                'progress' => $total > 0 ? (int) round(($completed / $total) * 100) : 0,
            ];
        })->values()->all();

        return new ProgressData(
            completed_lessons: $completedLessons,
            total_lessons: $totalLessons,
            progress_percentage: $progressPercentage,
            sections: $sections,
        );
    }
}
