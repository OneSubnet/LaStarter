<?php

namespace Modules\Tasks;

use App\Core\Hooks\Hook;
use App\Core\Modules\ModuleServiceProvider;

class TaskServiceProvider extends ModuleServiceProvider
{
    protected string $identifier = 'tasks';

    public function __construct($app)
    {
        parent::__construct($app);
        $this->basePath = base_path('extensions/modules/tasks');
    }

    protected function registerModule(): void
    {
        //
    }

    protected function bootModule(): void
    {
        $this->loadModuleMigrations();

        Hook::dispatch(Hook::MODULE_BOOT, ['module' => 'tasks']);
    }
}
