<?php

namespace Modules\Lms\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Lms\Models\Certificate;

class CertificateController extends Controller
{
    public function show(Certificate $certificate): Response
    {
        Gate::authorize('lms.view');
        $certificate->load('enrollment.course', 'enrollment.user');

        return Inertia::render('lms/certificates/Show', [
            'certificate' => [
                'id' => $certificate->id,
                'certificate_number' => $certificate->certificate_number,
                'issued_at' => $certificate->issued_at?->toISOString(),
                'teacher_name' => $certificate->teacher_name,
                'teacher_role' => $certificate->teacher_role,
                'theme' => $certificate->theme,
                'enrollment' => [
                    'course' => ['title' => $certificate->enrollment?->course?->title],
                    'user' => ['name' => $certificate->enrollment?->user?->name],
                    'name' => $certificate->enrollment?->user?->name,
                ],
            ],
        ]);
    }
}
