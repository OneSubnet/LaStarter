<?php

namespace App\Providers;

use App\Core\Audit\AuditLogger;
use App\Core\Cache\Listeners\InvalidateCacheListener;
use App\Core\Context\AppContext;
use App\Core\Context\SharedPropsResolver;
use App\Core\Extensions\Console\ExtensionsCheckUpdatesCommand;
use App\Core\Extensions\Console\ExtensionsDisableCommand;
use App\Core\Extensions\Console\ExtensionsEnableCommand;
use App\Core\Extensions\Console\ExtensionsInstallCommand;
use App\Core\Extensions\Console\ExtensionsListCommand;
use App\Core\Extensions\Console\ExtensionsScanCommand;
use App\Core\Extensions\Console\ExtensionsSyncCommand;
use App\Core\Extensions\Console\ExtensionsUninstallCommand;
use App\Core\Extensions\Console\ExtensionsUpdateCommand;
use App\Core\Extensions\Events\ExtensionDisabled;
use App\Core\Extensions\Events\ExtensionEnabled;
use App\Core\Extensions\Events\ExtensionInstalled;
use App\Core\Extensions\Events\ExtensionUninstalled;
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
use App\Core\System\BackupManager;
use App\Core\System\CompatibilityChecker;
use App\Core\System\Console\CoreUpdateCommand;
use App\Core\System\Console\CoreVersionCommand;
use App\Core\System\CoreUpdater;
use App\Core\System\ReleaseClient;
use App\Core\Widgets\CoreWidgetDataProvider;
use App\Core\Widgets\WidgetDataProvider;
use App\Core\Widgets\WidgetDefinition;
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
        $this->app->singleton(SharedPropsResolver::class);

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
        $this->app->singleton(WidgetDataProvider::class);
        $this->app->singleton(ModuleRouteRegistrar::class);

        // System update
        $this->app->singleton(ReleaseClient::class, function () {
            return new ReleaseClient(
                config('lastarter.update_repo', 'OneSubnet/LaStarter'),
                config('lastarter.github_token'),
            );
        });
        $this->app->singleton(CompatibilityChecker::class);
        $this->app->singleton(BackupManager::class, function () {
            return new BackupManager(storage_path('backups'));
        });
        $this->app->singleton(CoreUpdater::class);

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
            CoreUpdateCommand::class,
            CoreVersionCommand::class,
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

        // Cache invalidation on extension lifecycle events
        $cacheListener = InvalidateCacheListener::class;
        Event::listen(ExtensionEnabled::class, [$cacheListener, 'handleExtensionEnabled']);
        Event::listen(ExtensionDisabled::class, [$cacheListener, 'handleExtensionDisabled']);
        Event::listen(ExtensionInstalled::class, [$cacheListener, 'handleExtensionInstalled']);
        Event::listen(ExtensionUninstalled::class, [$cacheListener, 'handleExtensionUninstalled']);

        require_once app_path('Core/Support/helpers.php');

        // Register core widgets
        $widgets = $this->app->make(WidgetRegistry::class);
        $widgets->register(new WidgetDefinition(
            identifier: 'core-team-members',
            label: 'Team Members',
            module: 'core',
            type: 'stat',
            size: ['w' => 3, 'h' => 1],
            description: 'Total members and membership trends',
            modes: ['stat', 'chart', 'table'],
        ));
        $widgets->register(new WidgetDefinition(
            identifier: 'core-online-members',
            label: 'Online Members',
            module: 'core',
            type: 'stat',
            size: ['w' => 3, 'h' => 1],
            description: 'Currently online team members',
            modes: ['stat', 'table'],
        ));
        $widgets->register(new WidgetDefinition(
            identifier: 'core-activity',
            label: 'Recent Activity',
            module: 'core',
            type: 'list',
            size: ['w' => 4, 'h' => 2],
            description: 'Latest actions across the team',
            modes: ['stat', 'chart', 'table'],
        ));
        $widgets->register(new WidgetDefinition(
            identifier: 'core-unread-notifications',
            label: 'Unread Notifications',
            module: 'core',
            type: 'stat',
            size: ['w' => 3, 'h' => 1],
            description: 'Your pending notifications',
            modes: ['stat'],
        ));
        $widgets->register(new WidgetDefinition(
            identifier: 'core-active-extensions',
            label: 'Active Extensions',
            module: 'core',
            type: 'stat',
            size: ['w' => 3, 'h' => 1],
            description: 'Enabled extensions and modules',
            modes: ['stat', 'table'],
        ));
        $widgets->register(new WidgetDefinition(
            identifier: 'core-team-roles',
            label: 'Team Roles',
            module: 'core',
            type: 'stat',
            size: ['w' => 3, 'h' => 1],
            description: 'Roles and member distribution',
            modes: ['stat', 'table'],
        ));

        // ── Cross-referenced data widgets ──────────────────

        $widgets->register(new WidgetDefinition(
            identifier: 'core-member-activity',
            label: 'Member Activity',
            module: 'core',
            type: 'list',
            size: ['w' => 4, 'h' => 2],
            description: 'Most active members ranked by actions',
            modes: ['stat', 'table'],
        ));
        $widgets->register(new WidgetDefinition(
            identifier: 'core-audit-by-module',
            label: 'Audit by Module',
            module: 'core',
            type: 'chart',
            size: ['w' => 4, 'h' => 2],
            description: 'Action distribution across modules',
            modes: ['stat', 'chart', 'table'],
        ));
        $widgets->register(new WidgetDefinition(
            identifier: 'core-session-trend',
            label: 'Session Trend',
            module: 'core',
            type: 'stat',
            size: ['w' => 3, 'h' => 1],
            description: 'Active sessions and unique visitors',
            modes: ['stat', 'chart'],
        ));
        $widgets->register(new WidgetDefinition(
            identifier: 'core-permission-coverage',
            label: 'Permission Coverage',
            module: 'core',
            type: 'stat',
            size: ['w' => 3, 'h' => 1],
            description: 'Permissions assigned per role',
            modes: ['stat', 'table'],
        ));
        $widgets->register(new WidgetDefinition(
            identifier: 'core-notification-response',
            label: 'Notification Response',
            module: 'core',
            type: 'stat',
            size: ['w' => 3, 'h' => 1],
            description: 'Read rate and response time',
            modes: ['stat'],
        ));
        $widgets->register(new WidgetDefinition(
            identifier: 'core-onboarding-progress',
            label: 'Onboarding Progress',
            module: 'core',
            type: 'stat',
            size: ['w' => 3, 'h' => 1],
            description: 'Members who completed onboarding',
            modes: ['stat', 'table'],
        ));
        $widgets->register(new WidgetDefinition(
            identifier: 'core-member-joins',
            label: 'Member Joins',
            module: 'core',
            type: 'chart',
            size: ['w' => 4, 'h' => 2],
            description: 'New member registrations over time',
            modes: ['stat', 'chart'],
        ));
        $widgets->register(new WidgetDefinition(
            identifier: 'core-top-actions',
            label: 'Top Actions',
            module: 'core',
            type: 'list',
            size: ['w' => 4, 'h' => 2],
            description: 'Most performed actions this period',
            modes: ['stat', 'table'],
        ));
        $widgets->register(new WidgetDefinition(
            identifier: 'core-security-overview',
            label: 'Security Overview',
            module: 'core',
            type: 'stat',
            size: ['w' => 3, 'h' => 1],
            description: 'Unique IPs, devices and access patterns',
            modes: ['stat'],
        ));
        $widgets->register(new WidgetDefinition(
            identifier: 'core-notification-types',
            label: 'Notification Types',
            module: 'core',
            type: 'chart',
            size: ['w' => 4, 'h' => 2],
            description: 'Distribution of notifications by category',
            modes: ['stat', 'chart', 'table'],
        ));

        // Register core widget data provider
        $this->app->make(ModuleApiRegistry::class)->register(
            CoreWidgetDataProvider::class,
            'core',
            new CoreWidgetDataProvider,
        );

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
