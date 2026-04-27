<?php

namespace Modules\Projects;

use App\Core\Modules\ModuleServiceProvider;

class ProjectServiceProvider extends ModuleServiceProvider
{
    protected function registerModule(): void
    {
        //
    }

    protected function bootModule(): void
    {
        $this->loadModuleMigrations();
    }

    protected function modulePath(string $path = ''): string
    {
        $basePath = dirname(__DIR__);

        return $basePath.($path !== '' ? DIRECTORY_SEPARATOR.$path : '');
    }

    protected function moduleNamespace(): string
    {
        return 'Modules\\Projects';
    }
}
