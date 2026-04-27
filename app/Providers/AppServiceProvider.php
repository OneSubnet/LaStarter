<?php

namespace App\Providers;

use App\Core\Audit\AuditLogger;
use App\Core\Context\AppContext;
use App\Core\Dashboard\DashboardWidgetBag;
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
use App\Core\Hooks\Hook;
use App\Core\Settings\SettingManager;
use App\Core\Themes\ComponentResolver;
use App\Models\Extension;
use App\Models\Team;
use App\Models\User;
use App\Policies\ExtensionPolicy;
use App\Policies\RolePolicy;
use App\Policies\TeamPolicy;
use App\Policies\UserPolicy;
use Carbon\Carbon;
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

        // Core dashboard widgets
        Hook::listen(Hook::DASHBOARD_RENDER, function (DashboardWidgetBag $bag, ?string $from = null, ?string $to = null) {
            $user = request()->user();
            $team = $user?->currentTeam;

            if (! $team) {
                return;
            }

            $startDate = $from ? Carbon::parse($from)->startOfDay() : now()->subDays(30)->startOfDay();
            $endDate = $to ? Carbon::parse($to)->endOfDay() : now()->endOfDay();

            // ── Stats ──

            $activeMembers = $team->memberships()->where('status', 'active')->count();
            $pendingInvites = $team->invitations()->count();
            $newMembers = $team->memberships()
                ->where('status', 'active')
                ->whereBetween('joined_at', [$startDate, $endDate])
                ->count();

            $bag->add('team_members', 'Members', 'Active team members', 'Users', 'stat', [
                'value' => $activeMembers,
                'label' => $newMembers > 0 ? "+{$newMembers} this period" : 'All active',
                'trend' => null,
            ], 'overview', 100);

            $rolesCount = Role::where('team_id', $team->id)->count();
            $bag->add('team_roles', 'Roles', 'Custom team roles', 'ShieldCheck', 'stat', [
                'value' => $rolesCount,
                'label' => 'Configured roles',
            ], 'overview', 101);

            $bag->add('team_pending_invites', 'Pending Invitations', 'Awaiting response', 'Mail', 'stat', [
                'value' => $pendingInvites,
                'label' => $pendingInvites > 0 ? 'Awaiting response' : 'No pending',
            ], 'overview', 102);

            $onlineUserIds = DB::table('sessions')
                ->where('last_activity', '>=', now()->subMinutes(5)->timestamp)
                ->pluck('user_id')
                ->filter()
                ->unique()
                ->values()
                ->all();

            $onlineMembers = $team->members()
                ->wherePivot('status', 'active')
                ->whereIn('users.id', $onlineUserIds)
                ->count();

            $bag->add('team_online', 'Online Members', 'Active in the last 5 min', 'Activity', 'stat', [
                'value' => $onlineMembers,
                'label' => $onlineMembers > 0 ? 'Currently online' : 'No one online',
            ], 'overview', 103);

            $enabledExtensions = $team->teamExtensions()->where('is_enabled', true)->count();
            $bag->add('team_extensions', 'Extensions', 'Active extensions', 'Puzzle', 'stat', [
                'value' => $enabledExtensions,
                'label' => 'Enabled modules',
            ], 'overview', 104);

            // ── Charts ──

            $memberGrowth = $team->memberships()
                ->where('status', 'active')
                ->whereBetween('joined_at', [$startDate, $endDate])
                ->selectRaw('DATE(joined_at) as date, COUNT(*) as total')
                ->groupByRaw('DATE(joined_at)')
                ->orderBy('date')
                ->get()
                ->map(fn ($row) => ['date' => $row->date, 'value' => (int) $row->total])
                ->values()
                ->all();

            $bag->add('team_members_growth', 'Member Growth', 'New members over time', 'TrendingUp', 'chart', [
                'chartType' => 'line',
                'data' => $memberGrowth,
                'xKey' => 'date',
                'yKey' => 'value',
            ], 'overview', 110);

            $roleDistribution = DB::table('model_has_roles')
                ->where('model_has_roles.team_id', $team->id)
                ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
                ->selectRaw('roles.name, COUNT(*) as count')
                ->groupBy('roles.name')
                ->get()
                ->map(fn ($row) => ['name' => ucfirst($row->name), 'value' => (int) $row->count])
                ->values()
                ->all();

            $bag->add('team_roles_distribution', 'Roles Distribution', 'Members per role', 'PieChart', 'chart', [
                'chartType' => 'pie',
                'data' => $roleDistribution,
            ], 'overview', 111);

            $inviteActivity = $team->invitations()
                ->whereBetween('created_at', [$startDate, $endDate])
                ->selectRaw('DATE(created_at) as date, COUNT(*) as total')
                ->groupByRaw('DATE(created_at)')
                ->orderBy('date')
                ->get()
                ->map(fn ($row) => ['date' => $row->date, 'value' => (int) $row->total])
                ->values()
                ->all();

            $bag->add('team_invites_growth', 'Invitations Sent', 'Invites over time', 'BarChart3', 'chart', [
                'chartType' => 'bar',
                'data' => $inviteActivity,
                'xKey' => 'date',
                'yKey' => 'value',
            ], 'overview', 112);

            // ── Tables ──

            $recentMembers = $team->memberships()
                ->with('user')
                ->where('status', 'active')
                ->orderBy('joined_at', 'desc')
                ->limit(10)
                ->get()
                ->map(fn ($m) => [
                    'name' => $m->user?->name ?? '—',
                    'role' => ucfirst($m->role instanceof \BackedEnum ? $m->role->value : (string) ($m->role ?? 'member')),
                    'joined' => $m->joined_at?->toISOString(),
                ])
                ->all();

            $bag->add('team_recent_members', 'Recent Members', 'Latest joined members', 'List', 'table', [
                'columns' => ['Name', 'Role', 'Joined'],
                'rows' => $recentMembers,
            ], 'overview', 120);

            $recentInvites = $team->invitations()
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(fn ($inv) => [
                    'email' => $inv->email,
                    'role' => ucfirst($inv->role ?? 'member'),
                    'status' => ucfirst($inv->status ?? 'pending'),
                    'date' => $inv->created_at?->toISOString(),
                ])
                ->all();

            $bag->add('team_recent_invites', 'Recent Invitations', 'Latest invitations', 'List', 'table', [
                'columns' => ['Email', 'Role', 'Status', 'Date'],
                'rows' => $recentInvites,
            ], 'overview', 121);
        });

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
            // Extensions not available during initial setup
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
