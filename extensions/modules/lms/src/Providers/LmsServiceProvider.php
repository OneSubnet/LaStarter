<?php

namespace Modules\Lms\Providers;

use App\Core\Hooks\Hook;
use App\Core\Modules\ModuleServiceProvider;
use App\Core\Sidebar\ContextualSidebarPayload;
use Illuminate\Contracts\Events\Dispatcher;
use Modules\EmailBuilder\Services\TemplateManager;
use Modules\Lms\Domain\Course\Events\CommentCreatedEvent;
use Modules\Lms\Domain\Enrollment\Events\CourseCompletedEvent;
use Modules\Lms\Domain\Enrollment\Events\LearnerEnrolledEvent;
use Modules\Lms\Listeners\IssueCertificateOnCourseCompleted;
use Modules\Lms\Listeners\NotifyInstructorOnEnrollment;
use Modules\Lms\Listeners\NotifyOnCourseCompleted;
use Modules\Lms\Listeners\NotifyOnNewComment;
use Modules\Lms\Models\Course;
use Modules\Lms\Models\Enrollment;
use Modules\Lms\Models\LessonProgress;

class LmsServiceProvider extends ModuleServiceProvider
{
    protected function identifier(): string
    {
        return 'lms';
    }

    protected function registerModule(): void
    {
        //
    }

    protected function bootModule(): void
    {
        $this->loadTranslationsFrom(
            $this->modulePath('resources/locales'),
            'lms'
        );

        $this->loadTranslationsFrom(
            $this->modulePath('resources/lang'),
            'lms'
        );

        $this->loadViewsFrom(
            $this->modulePath('resources/views'),
            'lms'
        );

        $this->registerEmailTemplates();
        $this->registerSidebarHook();

        $events = app(Dispatcher::class);

        $events->listen(
            LearnerEnrolledEvent::class,
            NotifyInstructorOnEnrollment::class,
        );

        $events->listen(
            CourseCompletedEvent::class,
            NotifyOnCourseCompleted::class,
        );

        $events->listen(
            CourseCompletedEvent::class,
            IssueCertificateOnCourseCompleted::class,
        );

        $events->listen(
            CommentCreatedEvent::class,
            NotifyOnNewComment::class,
        );
    }

    private function registerSidebarHook(): void
    {
        Hook::listen(Hook::SIDEBAR_BUILD, function (ContextualSidebarPayload $payload): void {
            $request = request();
            $routeName = $request->route()?->getName();

            if (! in_array($routeName, ['lms.learn.lesson', 'lms.learn.show'], true)) {
                return;
            }

            $courseId = $request->route('course');
            $lessonId = $routeName === 'lms.learn.lesson' ? (int) $request->route('lesson') : null;
            $userId = auth()->id();

            $course = Course::find($courseId);
            $enrollment = $course
                ? Enrollment::where('course_id', $courseId)->where('user_id', $userId)->first()
                : null;

            if (! $course || ! $enrollment) {
                return;
            }

            $teamSlug = $request->route('current_team')?->slug ?? $request->user()?->currentTeam?->slug ?? '';

            $payload->setHeader(
                $course->title,
                $enrollment->progress.'%',
                "/{$teamSlug}/lms/learn/{$course->id}",
                $enrollment->progress,
            );

            $course->load(['sections.lessons' => fn ($q) => $q->orderBy('sort_order')]);

            $progressMap = LessonProgress::where('enrollment_id', $enrollment->id)
                ->get()
                ->keyBy('lesson_id');

            foreach ($course->sections as $section) {
                $items = $section->lessons->map(function ($l) use ($lessonId, $progressMap, $courseId, $teamSlug) {
                    $progress = $progressMap->get($l->id);
                    $done = $progress && $progress->progress >= LessonProgress::COMPLETION_THRESHOLD;

                    return [
                        'title' => $l->title,
                        'href' => "/{$teamSlug}/lms/learn/{$courseId}/lessons/{$l->id}",
                        'icon' => $done ? 'check' : ($l->content_type ?? 'text'),
                        'meta' => $l->video_duration_seconds
                            ? floor($l->video_duration_seconds / 60).'min'
                            : null,
                        'active' => $l->id === $lessonId,
                    ];
                })->all();

                $payload->addSection($section->title, $items);
            }
        });
    }

    private function registerEmailTemplates(): void
    {
        if (! class_exists(TemplateManager::class)) {
            return;
        }

        $tm = app(TemplateManager::class);

        $tm->registerDefault('lms', 'enrolled', [
            'fr' => [
                'subject' => 'Vous êtes inscrit à {{course}}',
                'html_content' => '<h2>Bienvenue !</h2><p>Bonjour {{name}}, vous avez été inscrit à <strong>{{course}}</strong>.</p><p><a href="{{course_url}}">Commencer la formation</a></p>',
            ],
            'en' => [
                'subject' => 'You are enrolled in {{course}}',
                'html_content' => '<h2>Welcome!</h2><p>Hello {{name}}, you have been enrolled in <strong>{{course}}</strong>.</p><p><a href="{{course_url}}">Start the course</a></p>',
            ],
        ], [
            'name' => "Nom de l'apprenant",
            'course' => 'Titre de la formation',
            'course_url' => 'Lien vers la formation',
        ]);

        $tm->registerDefault('lms', 'course-completed', [
            'fr' => [
                'subject' => 'Félicitations ! Vous avez terminé {{course}}',
                'html_content' => '<h2>Formation terminée !</h2><p>Bravo {{name}}, vous avez terminé <strong>{{course}}</strong> avec {{progress}}% de progression.</p><p><a href="{{certificate_url}}">Voir mon certificat</a></p>',
            ],
            'en' => [
                'subject' => 'Congratulations! You completed {{course}}',
                'html_content' => '<h2>Course completed!</h2><p>Great job {{name}}, you completed <strong>{{course}}</strong> with {{progress}}% progress.</p><p><a href="{{certificate_url}}">View my certificate</a></p>',
            ],
        ], [
            'name' => "Nom de l'apprenant",
            'course' => 'Titre de la formation',
            'progress' => 'Progression (%)',
            'certificate_url' => 'Lien vers le certificat',
        ]);

        $tm->registerDefault('lms', 'certificate-issued', [
            'fr' => [
                'subject' => 'Votre certificat est prêt — {{course}}',
                'html_content' => '<h2>Certificat disponible</h2><p>Bonjour {{name}}, votre certificat pour <strong>{{course}}</strong> est prêt.</p><p><a href="{{certificate_url}}">Voir mon certificat</a></p>',
            ],
            'en' => [
                'subject' => 'Your certificate is ready — {{course}}',
                'html_content' => '<h2>Certificate Available</h2><p>Hello {{name}}, your certificate for <strong>{{course}}</strong> is ready.</p><p><a href="{{certificate_url}}">View my certificate</a></p>',
            ],
        ], [
            'name' => "Nom de l'apprenant",
            'course' => 'Titre de la formation',
            'certificate_url' => 'Lien vers le certificat',
        ]);

        $tm->registerDefault('lms', 'new-enrollment', [
            'fr' => [
                'subject' => 'Nouvel apprenant inscrit à {{course}}',
                'html_content' => '<h2>Nouvelle inscription</h2><p>Bonjour {{name}},</p><p><strong>{{learner}}</strong> vient de s\'inscrire à votre formation <strong>{{course}}</strong>.</p><p><a href="{{course_url}}">Voir la formation</a></p>',
            ],
            'en' => [
                'subject' => 'New learner enrolled in {{course}}',
                'html_content' => '<h2>New Enrollment</h2><p>Hello {{name}},</p><p><strong>{{learner}}</strong> just enrolled in your course <strong>{{course}}</strong>.</p><p><a href="{{course_url}}">View course</a></p>',
            ],
        ], [
            'name' => 'Nom du formateur',
            'learner' => "Nom de l'apprenant",
            'course' => 'Titre de la formation',
            'course_url' => 'Lien vers la formation',
        ]);

        $tm->registerDefault('lms', 'course-completed-instructor', [
            'fr' => [
                'subject' => '{{learner}} a terminé {{course}}',
                'html_content' => '<h2>Formation terminée par un apprenant</h2><p>Bonjour {{name}},</p><p><strong>{{learner}}</strong> a terminé <strong>{{course}}</strong> avec {{progress}}% de progression.</p><p><a href="{{analytics_url}}">Voir les statistiques</a></p>',
            ],
            'en' => [
                'subject' => '{{learner}} completed {{course}}',
                'html_content' => '<h2>Course completed by learner</h2><p>Hello {{name}},</p><p><strong>{{learner}}</strong> completed <strong>{{course}}</strong> with {{progress}}% progress.</p><p><a href="{{analytics_url}}">View analytics</a></p>',
            ],
        ], [
            'name' => 'Nom du formateur',
            'learner' => "Nom de l'apprenant",
            'course' => 'Titre de la formation',
            'progress' => 'Progression (%)',
            'analytics_url' => 'Lien vers les statistiques',
        ]);

        $tm->registerDefault('lms', 'password-setup', [
            'fr' => [
                'subject' => 'Configurez votre mot de passe — {{team}}',
                'html_content' => '<h2>Bienvenue !</h2><p>Bonjour {{name}}, un compte a été créé pour vous sur <strong>{{team}}</strong>.</p><p><a href="{{reset_url}}">Définir mon mot de passe</a></p><p style="font-size:12px;color:#666;">Ce lien expire dans 48 heures.</p>',
            ],
            'en' => [
                'subject' => 'Set up your password — {{team}}',
                'html_content' => '<h2>Welcome!</h2><p>Hello {{name}}, an account has been created for you on <strong>{{team}}</strong>.</p><p><a href="{{reset_url}}">Set my password</a></p><p style="font-size:12px;color:#666;">This link expires in 48 hours.</p>',
            ],
        ], [
            'name' => 'Nom de l\'utilisateur',
            'team' => 'Nom de l\'équipe',
            'reset_url' => 'Lien de configuration',
        ]);
    }
}
