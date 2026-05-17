<?php

namespace App\Core\Modules;

use App\Core\Hooks\Hook;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

abstract class ModuleServiceProvider extends ServiceProvider
{
    /**
     * The module identifier (e.g. "ailes-invisibles").
     */
    abstract protected function identifier(): string;

    /**
     * Register module-specific bindings in the container.
     */
    protected function registerModule(): void
    {
        //
    }

    /**
     * Boot module-specific logic (translations, views, etc.).
     * Routes and migrations are handled automatically.
     */
    protected function bootModule(): void
    {
        //
    }

    /**
     * Map policies to models. Override to register module policies.
     *
     * @return array<class-string, class-string> Model => Policy
     */
    protected function policies(): array
    {
        return [];
    }

    final public function register(): void
    {
        $this->registerModule();
    }

    final public function boot(): void
    {
        $this->registerPolicies();
        $this->loadModuleRoutes();
        $this->loadModuleMigrations();
        $this->bootModule();
    }

    private function registerPolicies(): void
    {
        foreach ($this->policies() as $model => $policy) {
            Gate::policy($model, $policy);
        }
    }

    private function loadModuleRoutes(): void
    {
        $routesPath = $this->modulePath('routes/web.php');

        if (! file_exists($routesPath)) {
            return;
        }

        app(ModuleRouteRegistrar::class)->register($routesPath, $this->identifier());
    }

    private function loadModuleMigrations(): void
    {
        $migrationPath = $this->modulePath('database/migrations');

        if (is_dir($migrationPath)) {
            $this->loadMigrationsFrom($migrationPath);
        }
    }

    protected function modulePath(string $path = ''): string
    {
        $reflector = new \ReflectionClass(static::class);
        $moduleDir = dirname($reflector->getFileName(), 3);

        return $moduleDir.($path !== '' ? '/'.$path : $path);
    }

    protected function registerApi(string $contract, object $implementation): void
    {
        app(ModuleApiRegistry::class)->register($contract, $this->identifier(), $implementation);
    }

    protected function consumeApi(string $contract): ?object
    {
        return app(ModuleApiRegistry::class)->get($contract);
    }

    protected function addAction(string $hook, callable $callback): void
    {
        Hook::listen($hook, $callback);
    }
}
