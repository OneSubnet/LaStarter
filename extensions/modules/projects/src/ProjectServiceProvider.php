<?php

namespace Modules\Projects;

use App\Core\Hooks\Hook;
use App\Core\Modules\ModuleServiceProvider;

class ProjectServiceProvider extends ModuleServiceProvider
{
    protected string $identifier = 'projects';

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

        Hook::dispatch(Hook::MODULE_BOOT, ['module' => 'projects']);
    }
}
