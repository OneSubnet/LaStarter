<?php

namespace Modules\Forms;

use App\Core\Dashboard\DashboardWidgetBag;
use App\Core\Hooks\Hook;
use App\Core\Modules\ModuleServiceProvider;
use Modules\Forms\Models\Form;
use Modules\Forms\Models\FormSubmission;
use Modules\Forms\Policies\FormPolicy;
use Modules\Forms\Policies\FormSubmissionPolicy;

class FormServiceProvider extends ModuleServiceProvider
{
    protected string $identifier = 'forms';

    protected array $policies = [
        Form::class => FormPolicy::class,
        FormSubmission::class => FormSubmissionPolicy::class,
    ];

    public function __construct($app)
    {
        parent::__construct($app);
        $this->basePath = base_path('extensions/modules/forms');
    }

    protected function registerModule(): void
    {
        //
    }

    protected function bootModule(): void
    {
        $this->loadModuleMigrations();

        Hook::listen(Hook::DASHBOARD_RENDER, function (DashboardWidgetBag $bag) {
            $bag->add(
                'forms',
                'Forms',
                'Total forms',
                'FileText',
                'stat',
                Form::count(),
                30,
            );
        });

        Hook::dispatch(Hook::MODULE_BOOT, ['module' => 'forms']);
    }
}
