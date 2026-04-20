<?php

namespace Modules\Projects;

use App\Core\Dashboard\DashboardWidgetBag;
use App\Core\Hooks\Hook;
use App\Core\Modules\ModuleServiceProvider;
use Modules\Projects\Models\Project;
use Modules\Projects\Policies\ProjectPolicy;

class ProjectServiceProvider extends ModuleServiceProvider
{
    protected string $identifier = 'projects';

    protected array $policies = [
        Project::class => ProjectPolicy::class,
    ];

    public function __construct($app)
    {
        parent::__construct($app);
        $this->basePath = base_path('extensions/modules/projects');
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
                'projects',
                'Projects',
                'Active projects',
                'FolderKanban',
                'stat',
                Project::count(),
                10,
            );
        });

        Hook::dispatch(Hook::MODULE_BOOT, ['module' => 'projects']);
    }
}
