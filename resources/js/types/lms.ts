// =============================================================================
// LMS Module - Shared Types
// =============================================================================
// Centralized type definitions for the LMS (Learning Management System) module.
// =============================================================================

// -----------------------------------------------------------------------------
// Paginated Response
// -----------------------------------------------------------------------------

export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

// -----------------------------------------------------------------------------
// Course
// -----------------------------------------------------------------------------

export type CourseFormData = {
    id: number;
    title: string;
    description: string | null;
    thumbnail_path: string | null;
    status: CourseStatus;
    estimated_duration_minutes: number | null;
    settings?: {
        enable_comments?: boolean;
        enable_notes?: boolean;
        enable_bookmarks?: boolean;
        auto_block_on_completion?: boolean;
    };
    certificate_enabled?: boolean;
    certificate_threshold?: number;
    certificate_teacher_name?: string;
    certificate_teacher_role?: string;
};

export type CourseRow = {
    id: number;
    title: string;
    description: string | null;
    status: CourseStatus;
    sections_count: number;
    enrollments_count: number;
    estimated_duration_minutes: number | null;
    created_at: string;
};

export type CourseStatus = 'draft' | 'published' | 'archived';

export const courseStatusVariants: Record<
    CourseStatus,
    'default' | 'secondary' | 'outline'
> = {
    draft: 'outline',
    published: 'default',
    archived: 'secondary',
};

export type CourseInfo = {
    id: number;
    title: string;
    slug: string | null;
};

// -----------------------------------------------------------------------------
// Section
// -----------------------------------------------------------------------------

export type SectionItem = {
    id: number;
    title: string;
    description: string | null;
    sort_order: number;
    is_published: boolean;
    lessons: LessonItem[];
};

// -----------------------------------------------------------------------------
// Lesson
// -----------------------------------------------------------------------------

export type LessonItem = {
    id: number;
    section_id: number | null;
    title: string;
    slug: string | null;
    content_type: LessonContentType;
    content: string | null;
    video_url: string | null;
    video_duration_seconds: number | null;
    sort_order: number;
    is_published: boolean;
};

export type LessonContentType = 'text' | 'video' | 'quiz';

export type LessonProgressItem = {
    id: number;
    enrollment_id: number;
    lesson_id: number;
    status: LessonProgressStatus;
    progress: number;
    time_spent_seconds: number;
    completed_at: string | null;
    last_position: number | null;
};

export type LessonProgressStatus = 'not_started' | 'in_progress' | 'completed';

// -----------------------------------------------------------------------------
// Enrollment
// -----------------------------------------------------------------------------

export type EnrollmentItem = {
    id: number;
    user_id: number | null;
    name: string | null;
    email: string | null;
    role: EnrollmentRole;
    progress: number;
};

export type EnrollmentRole = 'learner' | 'instructor' | 'assistant';

export type EnrollmentWithCourse = {
    id: number;
    course_id: number;
    course: {
        id: number;
        title: string;
        description: string | null;
        sections_count: number;
        enrollments_count: number;
    };
    progress: number;
    enrolled_at: string;
    completed_at: string | null;
    last_accessed_at: string | null;
    last_lesson_title?: string | null;
};

// -----------------------------------------------------------------------------
// Bookmarked Lesson
// -----------------------------------------------------------------------------

export type BookmarkedLesson = {
    course_id: number;
    course_title: string;
    lesson_id: number;
    lesson_title: string;
};

// -----------------------------------------------------------------------------
// Learner
// -----------------------------------------------------------------------------

export type LearnerRow = {
    id: number;
    name: string;
    email: string;
    enrollments_count: number;
    created_at: string | null;
};

export type LearnerCourseProgress = {
    enrollment_id: number;
    course_id: number;
    course_title: string;
    course_status: CourseStatus;
    is_blocked: boolean;
    enrolled_at: string;
    completed_at: string | null;
    progress: number;
    sections: LearnerSectionProgress[];
};

export type LearnerSectionProgress = {
    id: number;
    title: string;
    sort_order: number;
    lessons: LearnerLessonProgress[];
};

export type LearnerLessonProgress = {
    id: number;
    title: string;
    content_type: LessonContentType;
    sort_order: number;
    is_published: boolean;
    status: LessonProgressStatus;
    progress: number;
    completed_at: string | null;
};

export type LearnerSearchResult = {
    id: number;
    name: string;
    email: string;
};

// -----------------------------------------------------------------------------
// Enrollment Payload (create or select)
// -----------------------------------------------------------------------------

export type EnrollExistingPayload = {
    role: EnrollmentRole;
    user_id: number;
};

export type EnrollNewPayload = {
    role: EnrollmentRole;
    name: string | null;
    email: string | null;
    create_user: true;
};

export type EnrollPayload = EnrollExistingPayload | EnrollNewPayload;

// -----------------------------------------------------------------------------
// Certificate
// -----------------------------------------------------------------------------

export type CertificateData = {
    id: number;
    enrollment_id: number;
    certificate_number: string;
    issued_at: string | null;
    pdf_path: string | null;
    teacher_name?: string | null;
    teacher_role?: string | null;
    theme?: string | null;
    enrollment?: {
        course?: { title: string };
        user?: { name: string };
        name?: string;
    };
};

// -----------------------------------------------------------------------------
// Quiz
// -----------------------------------------------------------------------------

export type QuizAnswer = {
    id: number;
    answer_text: string;
    is_correct?: boolean;
    sort_order?: number;
};

export type QuizQuestion = {
    id: number;
    question_text: string;
    explanation: string | null;
    sort_order?: number;
    answers: QuizAnswer[];
};

export type QuizResponse = {
    question_id: number;
    answer_id: number | null;
    is_correct: boolean;
};
