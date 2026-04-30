<?php

namespace App\Providers;

use App\Core\Audit\AuditLogger;
use App\Core\Context\AppContext;
use App\Core\Extensions\Console\ExtensionsDisableCommand;
use App\Core\Extensions\Console\ExtensionsEnableCommand;
use App\Core\Extensions\Console\ExtensionsInstallCommand;
use App\Core\Extensions\Console\ExtensionsListCommand;
use App\Core\Extensions\Console\ExtensionsMakeCommand;
use App\Core\Extensions\Console\ExtensionsScanCommand;
use App\Core\Extensions\Console\ExtensionsSyncCommand;
use App\Core\Extensions\Console\ExtensionsUninstallCommand;
use App\Core\Extensions\ExtensionManager;
use App\Core\Extensions\ExtensionScanner;
use App\Core\Extensions\Installer\ZipInstaller;
use App\Core\Extensions\Marketplace\MarketplaceClient;
use App\Core\Settings\SettingManager;
use App\Core\Themes\ComponentResolver;
use App\Models\Extension;
use App\Models\Team;
use App\Models\User;
use App\Policies\ExtensionPolicy;
use App\Policies\RolePolicy;
use App\Policies\TeamPolicy;
use App\Policies\UserPolicy;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\View;
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
        // Ensure the env binding exists — defensive fallback for CI where
        // detectEnvironment() may not have run before providers are registered.
        if (! $this->app->bound('env')) {
            $this->app->instance('env', $_ENV['APP_ENV'] ?? $_SERVER['APP_ENV'] ?? 'production');
        }

        // Register ExtensionManager as singleton
        $this->app->singleton(ExtensionManager::class);
        $this->app->singleton(ExtensionScanner::class);

        // Register SettingManager as singleton
        $this->app->singleton(SettingManager::class);

        // Register MarketplaceClient
        $this->app->singleton(MarketplaceClient::class, function () {
            return new MarketplaceClient(
                config('extensions.github_org', 'OneSubnet'),
                config('extensions.marketplace_repo', 'LaStarter-Marketplace'),
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
            ExtensionsInstallCommand::class,
            ExtensionsUninstallCommand::class,
            ExtensionsListCommand::class,
            ExtensionsMakeCommand::class,
        ]);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();

        Gate::policy(Role::class, RolePolicy::class);
        Gate::policy(Team::class, TeamPolicy::class);
        Gate::policy(Extension::class, ExtensionPolicy::class);
        Gate::policy(User::class, UserPolicy::class);

        // Load helpers
        require_once app_path('Core/Support/helpers.php');

        // Share active theme with all views for immediate class application
        View::share('activeTheme', $this->resolveActiveTheme());

        // Register extension autoloaders and service providers
        try {
            $manager = $this->app->make(ExtensionManager::class);
            $manager->registerAutoloaders();

            foreach ($manager->activeProviders() as $providerClass) {
                if (class_exists($providerClass)) {
                    $this->app->register($providerClass);
                }
            }
        } catch (\Throwable $e) {
            logger()->debug('Extensions not available during initial setup: '.$e->getMessage());
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

    protected function resolveActiveTheme(): ?string
    {
        try {
            $ctx = app(AppContext::class);
            $team = $ctx->team();

            if (! $team) {
                return null;
            }

            $identifier = app(ComponentResolver::class)->activeTheme($team->id);

            if (! $identifier) {
                return null;
            }

            if (! app(ExtensionManager::class)->isEnabled($identifier, $team->id)) {
                return null;
            }

            return $identifier;
        } catch (\Throwable) {
            return null;
        }
    }
}
