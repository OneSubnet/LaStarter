<?php

namespace App\Providers;

use App\Core\Audit\AuditLogger;
use App\Core\Context\AppContext;
use App\Core\Extensions\Console\ExtensionsCheckUpdatesCommand;
use App\Core\Extensions\Console\ExtensionsDisableCommand;
use App\Core\Extensions\Console\ExtensionsEnableCommand;
use App\Core\Extensions\Console\ExtensionsInstallCommand;
use App\Core\Extensions\Console\ExtensionsListCommand;
use App\Core\Extensions\Console\ExtensionsScanCommand;
use App\Core\Extensions\Console\ExtensionsSyncCommand;
use App\Core\Extensions\Console\ExtensionsUninstallCommand;
use App\Core\Extensions\Console\ExtensionsUpdateCommand;
use App\Core\Extensions\Events\ExtensionEnabled;
use App\Core\Extensions\ExtensionManager;
use App\Core\Extensions\ExtensionScanner;
use App\Core\Extensions\Installer\ZipInstaller;
use App\Core\Extensions\Listeners\SyncTeamPermissionsListener;
use App\Core\Extensions\Marketplace\MarketplaceClient;
use App\Core\Extensions\Updater\UpdateService;
use App\Core\Modules\MetricsAggregator;
use App\Core\Modules\ModuleApiRegistry;
use App\Core\Modules\ModuleRouteRegistrar;
use App\Core\Navigation\NavigationBuilder;
use App\Core\Settings\SettingManager;
use App\Core\Widgets\WidgetRegistry;
use App\Http\Middleware\EnsureTeamMembership;
use App\Models\Team;
use App\Models\User;
use App\Policies\RolePolicy;
use App\Policies\TeamPolicy;
use App\Policies\UserPolicy;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Spatie\Permission\Models\Role;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        if (! $this->app->bound('env')) {
            $this->app->instance('env', $_ENV['APP_ENV'] ?? $_SERVER['APP_ENV'] ?? 'production');
        }

        $this->app->singleton(AuditLogger::class);
        $this->app->scoped(AppContext::class);

        // Extension system
        $this->app->singleton(ExtensionScanner::class);
        $this->app->singleton(ExtensionManager::class);
        $this->app->singleton(SettingManager::class);
        $this->app->singleton(NavigationBuilder::class);

        $this->app->bind('navigation.builder', NavigationBuilder::class);

        $this->app->singleton(MarketplaceClient::class, function () {
            return new MarketplaceClient(
                config('extensions.github_org', 'OneSubnet'),
                config('extensions.marketplace_repo', 'LaStarter-Marketplace'),
                config('extensions.github_token'),
            );
        });

        $this->app->singleton(ZipInstaller::class, function () {
            return new ZipInstaller(
                config('extensions.path', base_path('extensions')),
                config('extensions.max_upload_size', 50 * 1024 * 1024),
            );
        });

        $this->app->singleton(UpdateService::class);

        $this->app->singleton(ModuleApiRegistry::class);
        $this->app->singleton(MetricsAggregator::class);
        $this->app->singleton(WidgetRegistry::class);
        $this->app->singleton(ModuleRouteRegistrar::class);

        Route::aliasMiddleware('team.membership', EnsureTeamMembership::class);

        $this->commands([
            ExtensionsScanCommand::class,
            ExtensionsSyncCommand::class,
            ExtensionsInstallCommand::class,
            ExtensionsEnableCommand::class,
            ExtensionsDisableCommand::class,
            ExtensionsUninstallCommand::class,
            ExtensionsListCommand::class,
            ExtensionsCheckUpdatesCommand::class,
            ExtensionsUpdateCommand::class,
        ]);
    }

    public function boot(): void
    {
        $this->configureDefaults();

        // Prevent implicit route model binding for {extension} parameter
        // — the ExtensionController uses string identifiers, not model instances
        Route::bind('extension', fn (string $value) => $value);

        Gate::policy(Role::class, RolePolicy::class);
        Gate::policy(Team::class, TeamPolicy::class);
        Gate::policy(User::class, UserPolicy::class);

        // Domain event listeners (Grafikart.fr pattern: Event → Listener)
        Event::listen(ExtensionEnabled::class, SyncTeamPermissionsListener::class);

        require_once app_path('Core/Support/helpers.php');

        // Register extension autoloaders and service providers
        try {
            $manager = $this->app->make(ExtensionManager::class);
            $manager->registerAutoloaders();

            $providers = $manager->orderedProviders();

            foreach ($providers as $providerClass) {
                if (class_exists($providerClass)) {
                    $this->app->register($providerClass);
                }
            }
        } catch (\Throwable $e) {
            logger()->error('Extensions not available during initial setup: '.$e->getMessage(), ['exception' => $e]);
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
