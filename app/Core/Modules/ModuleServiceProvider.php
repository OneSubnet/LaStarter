<?php

namespace App\Core\Modules;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

abstract class ModuleServiceProvider extends ServiceProvider
{
    protected string $identifier;

    protected string $basePath;

    /**
     * Model → Policy mapping.
     *
     * @var array<class-string, class-string>
     */
    protected array $policies = [];

    public function __construct($app)
    {
        parent::__construct($app);
    }

    /**
     * Get the absolute path to the module directory.
     */
    protected function modulePath(string $path = ''): string
    {
        return $this->basePath.($path ? DIRECTORY_SEPARATOR.$path : '');
    }

    /**
     * Load the module's route file.
     */
    protected function loadModuleRoutes(): void
    {
        $routesPath = $this->modulePath('routes'.DIRECTORY_SEPARATOR.'web.php');

        if (file_exists($routesPath)) {
            app(ModuleRouteRegistrar::class)->register($routesPath);
        }
    }

    /**
     * Load the module's migration files.
     */
    protected function loadModuleMigrations(): void
    {
        $migrationsPath = $this->modulePath('database'.DIRECTORY_SEPARATOR.'migrations');

        if (is_dir($migrationsPath)) {
            $this->loadMigrationsFrom($migrationsPath);
        }
    }

    /**
     * Register the module's policies with Gate.
     */
    protected function registerPolicies(): void
    {
        foreach ($this->policies as $model => $policy) {
            Gate::policy($model, $policy);
        }
    }

    /**
     * Register the module.
     */
    public function register(): void
    {
        $this->registerModule();
    }

    /**
     * Boot the module.
     */
    public function boot(): void
    {
        $this->registerPolicies();
        $this->bootModule();
        $this->loadModuleRoutes();
    }

    /**
     * Module-specific registration logic.
     */
    abstract protected function registerModule(): void;

    /**
     * Module-specific boot logic.
     */
    abstract protected function bootModule(): void;
}
