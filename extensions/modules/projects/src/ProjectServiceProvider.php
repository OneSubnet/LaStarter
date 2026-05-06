<?php

namespace Modules\Projects;

use App\Core\Modules\ModuleServiceProvider;

class ProjectServiceProvider extends ModuleServiceProvider
{
    protected function identifier(): string
    {
        return 'projects';
    }

    protected function registerModule(): void
    {
        //
    }

    protected function bootModule(): void
    {
        //
    }

    protected function policies(): array
    {
        return [];
    }
}
