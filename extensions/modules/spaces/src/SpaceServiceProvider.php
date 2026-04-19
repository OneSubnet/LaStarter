<?php

namespace Modules\Spaces;

use App\Core\Hooks\Hook;
use App\Core\Modules\ModuleServiceProvider;

class SpaceServiceProvider extends ModuleServiceProvider
{
    protected string $identifier = 'spaces';

    public function __construct($app)
    {
        parent::__construct($app);
        $this->basePath = base_path('extensions/modules/spaces');
    }

    protected function registerModule(): void
    {
        //
    }

    protected function bootModule(): void
    {
        $this->loadModuleRoutes();
        $this->loadModuleMigrations();

        Hook::dispatch(Hook::MODULE_BOOT, ['module' => 'spaces']);
    }
}
