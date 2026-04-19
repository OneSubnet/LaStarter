<?php

namespace App\Providers;

use App\Core\Audit\AuditLogger;
use App\Core\Context\AppContext;
use App\Core\Extensions\Console\ExtensionsDisableCommand;
use App\Core\Extensions\Console\ExtensionsEnableCommand;
use App\Core\Extensions\Console\ExtensionsScanCommand;
use App\Core\Extensions\Console\ExtensionsSyncCommand;
use App\Core\Extensions\ExtensionManager;
use App\Core\Extensions\ExtensionScanner;
use App\Core\Extensions\Installer\ZipInstaller;
use App\Core\Extensions\Marketplace\MarketplaceClient;
use App\Core\Settings\SettingManager;
use App\Models\Extension;
use App\Models\User;
use App\Policies\ExtensionPolicy;
use App\Policies\RolePolicy;
use App\Policies\UserPolicy;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Spatie\Permission\Models\Role;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register ExtensionManager as singleton
        $this->app->singleton(ExtensionManager::class);
        $this->app->singleton(ExtensionScanner::class);

        // Register SettingManager as singleton
        $this->app->singleton(SettingManager::class);

        // Register MarketplaceClient
        $this->app->singleton(MarketplaceClient::class, function () {
            return new MarketplaceClient(
                config('extensions.github_org', 'OneSubnet'),
                config('extensions.github_token'),
            );
        });

        // Register ZipInstaller
        $this->app->singleton(ZipInstaller::class, function () {
            return new ZipInstaller(
                config('extensions.path', base_path('extensions')),
                config('extensions.max_upload_size', 50 * 1024 * 1024),
            );
        });

        // Register AuditLogger as singleton
        $this->app->singleton(AuditLogger::class);

        // Register AppContext as scoped singleton (resolves once per request)
        $this->app->scoped(AppContext::class);

        // Register CLI commands
        $this->commands([
            ExtensionsScanCommand::class,
            ExtensionsSyncCommand::class,
            ExtensionsEnableCommand::class,
            ExtensionsDisableCommand::class,
        ]);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();

        Gate::policy(Role::class, RolePolicy::class);
        Gate::policy(Extension::class, ExtensionPolicy::class);
        Gate::policy(User::class, UserPolicy::class);

        // Load helpers
        require_once app_path('Core/Support/helpers.php');

        // Register extension autoloaders and service providers
        if (! $this->app->runningInConsole() || $this->app->runningUnitTests() || true) {
            try {
                $manager = $this->app->make(ExtensionManager::class);
                $manager->registerAutoloaders();

                foreach ($manager->activeProviders() as $providerClass) {
                    if (class_exists($providerClass)) {
                        $this->app->register($providerClass);
                    }
                }

                // Auto-discover module policies based on convention
                $this->registerModulePolicies($manager);
            } catch (\Throwable $e) {
                // Extensions not available during initial setup
                logger()->warning('Failed to boot extensions: '.$e->getMessage());
            }
        }
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function registerModulePolicies(ExtensionManager $manager): void
    {
        foreach ($manager->all() as $extension) {
            if ($extension->type !== 'module' || ! $extension->provider_class) {
                continue;
            }

            $namespace = dirname($extension->provider_class);
            $modelsPath = base_path('extensions/modules/'.$extension->slug.'/src/Models');

            if (! is_dir($modelsPath)) {
                continue;
            }

            foreach (glob($modelsPath.'/*.php') as $modelFile) {
                $modelName = basename($modelFile, '.php');
                $modelClass = $namespace.'\\Models\\'.$modelName;
                $policyClass = $namespace.'\\Policies\\'.$modelName.'Policy';

                if (class_exists($modelClass) && class_exists($policyClass)) {
                    Gate::policy($modelClass, $policyClass);
                }
            }
        }
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
