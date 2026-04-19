<?php

namespace Modules\Forms;

use App\Core\Hooks\Hook;
use App\Core\Modules\ModuleServiceProvider;

class FormServiceProvider extends ModuleServiceProvider
{
    protected string $identifier = 'forms';

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
        $this->loadModuleRoutes();
        $this->loadModuleMigrations();

        Hook::dispatch(Hook::MODULE_BOOT, ['module' => 'forms']);
    }
}
