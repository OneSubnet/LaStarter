<?php

namespace Tests\Concerns;

use App\Core\Modules\ModuleRouteRegistrar;
use App\Models\Extension;
use App\Models\TeamExtension;
use Spatie\Permission\Models\Permission;

trait WithLms
{
    protected function seedLmsPermissions(): void
    {
        $permissions = [
            'lms.view',
            'lms.courses.view',
            'lms.courses.create',
            'lms.courses.update',
            'lms.courses.delete',
            'lms.courses.publish',
            'lms.courses.manage_learners',
            'lms.courses.learn',
            'lms.courses.analytics',
            'lms.learners.manage',
        ];

        foreach ($permissions as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }
    }

    protected function runLmsMigrations(): void
    {
        $this->artisan('migrate', [
            '--path' => 'extensions/modules/lms/database/migrations',
            '--realpath' => true,
        ]);
    }

    protected function loadLmsRoutes(): void
    {
        $routesPath = base_path('extensions/modules/lms/routes/web.php');

        if (file_exists($routesPath)) {
            app(ModuleRouteRegistrar::class)->register($routesPath, 'lms');

            // Refresh the name/action lookup tables so route() helper works
            $router = app('router');
            $routes = $router->getRoutes();
            $routes->refreshNameLookups();
            app('url')->setRoutes($routes);
        }
    }

    protected function registerLmsExtension(): void
    {
        Extension::create([
            'identifier' => 'lms',
            'name' => 'LMS',
            'type' => 'module',
            'version' => '1.0.0',
            'description' => 'Learning Management System',
            'provider_class' => 'Modules\Lms\Providers\LmsServiceProvider',
            'namespace' => 'Modules\Lms',
            'permissions' => [],
            'navigation' => [],
            'state' => 'enabled',
        ]);
    }

    protected function enableLmsForTeam(int $teamId): void
    {
        $extension = Extension::where('identifier', 'lms')->first();
        if ($extension) {
            TeamExtension::firstOrCreate([
                'extension_id' => $extension->id,
                'team_id' => $teamId,
                'is_active' => true,
            ]);
        }
    }

    protected function setupLms(): void
    {
        $this->seedLmsPermissions();
        $this->runLmsMigrations();
        $this->loadLmsRoutes();
        $this->registerLmsExtension();
    }
}
