<?php

namespace Modules\AilesInvisibles;

use App\Core\Dashboard\DashboardWidgetBag;
use App\Core\Hooks\Hook;
use App\Core\Modules\ModuleServiceProvider;
use App\Http\Middleware\EnsureTeamMembership;
use Carbon\Carbon;
use Modules\AilesInvisibles\Http\Middleware\AuthenticateClient;
use Modules\AilesInvisibles\Http\Middleware\SharePortalInertiaData;
use Modules\AilesInvisibles\Models\Category;
use Modules\AilesInvisibles\Models\Client;
use Modules\AilesInvisibles\Models\ClientUser;
use Modules\AilesInvisibles\Models\Conversation;
use Modules\AilesInvisibles\Models\Event;
use Modules\AilesInvisibles\Models\Invoice;
use Modules\AilesInvisibles\Models\PortalDocument;
use Modules\AilesInvisibles\Models\Product;
use Modules\AilesInvisibles\Models\Quote;
use Modules\AilesInvisibles\Policies\CategoryPolicy;
use Modules\AilesInvisibles\Policies\ClientPolicy;
use Modules\AilesInvisibles\Policies\ConversationPolicy;
use Modules\AilesInvisibles\Policies\EventPolicy;
use Modules\AilesInvisibles\Policies\InvoicePolicy;
use Modules\AilesInvisibles\Policies\PortalDocumentPolicy;
use Modules\AilesInvisibles\Policies\ProductPolicy;
use Modules\AilesInvisibles\Policies\QuotePolicy;

class AilesInvisiblesServiceProvider extends ModuleServiceProvider
{
    protected string $identifier = 'ailes-invisibles';

    protected array $policies = [
        Category::class => CategoryPolicy::class,
        Client::class => ClientPolicy::class,
        Product::class => ProductPolicy::class,
        Event::class => EventPolicy::class,
        Quote::class => QuotePolicy::class,
        Invoice::class => InvoicePolicy::class,
        PortalDocument::class => PortalDocumentPolicy::class,
        Conversation::class => ConversationPolicy::class,
    ];

    public function __construct($app)
    {
        parent::__construct($app);
        $this->basePath = base_path('extensions/modules/ailes-invisibles');
    }

    protected function registerModule(): void
    {
        // Register client auth guard dynamically so the core stays clean
        $this->app['config']->set('auth.guards.client', [
            'driver' => 'session',
            'provider' => 'client_users',
        ]);
        $this->app['config']->set('auth.providers.client_users', [
            'driver' => 'eloquent',
            'model' => ClientUser::class,
        ]);
        $this->app['config']->set('auth.passwords.clients', [
            'provider' => 'client_users',
            'table' => 'password_reset_tokens',
            'expire' => 60,
            'throttle' => 60,
        ]);
    }

    protected function bootModule(): void
    {
        $this->loadModuleMigrations();

        Hook::listen(Hook::DASHBOARD_RENDER, function (DashboardWidgetBag $bag, ?string $from = null, ?string $to = null) {
            $startDate = $from ? Carbon::parse($from)->startOfDay() : now()->subDays(30)->startOfDay();
            $endDate = $to ? Carbon::parse($to)->endOfDay() : now()->endOfDay();

            // Clients stat
            $totalClients = Client::count();
            $periodClients = Client::whereBetween('created_at', [$startDate, $endDate])->count();
            $previousClients = Client::where('created_at', '<', $startDate)->count();
            $clientGrowth = $previousClients > 0 ? round((($periodClients) / $previousClients) * 100, 1) : ($periodClients > 0 ? 100 : 0);

            $bag->add('ai-clients', 'Clients', 'Total active clients', 'Users', 'stat', [
                'value' => $totalClients,
                'label' => "+{$periodClients} this period",
                'trend' => $clientGrowth > 0 ? ['direction' => 'up', 'percentage' => $clientGrowth] : null,
            ], 'crm', 10);

            // Revenue stat
            $revenue = (float) Invoice::whereBetween('created_at', [$startDate, $endDate])
                ->whereIn('status', ['paid', 'partial'])
                ->sum('paid_amount');
            $previousRevenue = (float) Invoice::where('created_at', '<', $startDate)
                ->whereIn('status', ['paid', 'partial'])
                ->sum('paid_amount');
            $revenueGrowth = $previousRevenue > 0 ? round((($revenue - $previousRevenue) / $previousRevenue) * 100, 1) : ($revenue > 0 ? 100 : 0);

            $bag->add('ai-revenue', 'Revenue', 'Period revenue', 'DollarSign', 'stat', [
                'value' => $revenue,
                'label' => $startDate->format('M d').' — '.$endDate->format('M d'),
                'trend' => $revenueGrowth > 0 ? ['direction' => 'up', 'percentage' => $revenueGrowth] : ($revenueGrowth < 0 ? ['direction' => 'down', 'percentage' => abs($revenueGrowth)] : null),
            ], 'crm', 11);

            // Invoices stat
            $pendingInvoices = Invoice::whereNotIn('status', ['paid', 'cancelled'])->count();
            $overdueInvoices = Invoice::where('status', 'overdue')->count();

            $bag->add('ai-invoices', 'Invoices', 'Pending invoices', 'Receipt', 'stat', [
                'value' => $pendingInvoices,
                'label' => $overdueInvoices > 0 ? "{$overdueInvoices} overdue" : 'All on track',
                'trend' => null,
            ], 'crm', 12);

            // Events stat
            $upcomingEvents = Event::where('start_date', '>=', now())
                ->whereBetween('start_date', [$startDate, $endDate])
                ->count();

            $daysRemaining = max(0, (int) now()->diffInDays($endDate, false));
            $bag->add('ai-events', 'Events', 'Upcoming events', 'Calendar', 'stat', [
                'value' => $upcomingEvents,
                'label' => $daysRemaining > 0 ? "Next {$daysRemaining} days" : 'Within range',
                'trend' => null,
            ], 'crm', 13);

            // Revenue over time chart
            $revenueByDay = Invoice::whereBetween('created_at', [$startDate, $endDate])
                ->whereIn('status', ['paid', 'partial'])
                ->selectRaw('DATE(created_at) as date, SUM(paid_amount) as total')
                ->groupByRaw('DATE(created_at)')
                ->orderBy('date')
                ->get()
                ->map(fn ($row) => ['date' => $row->date, 'value' => (float) $row->total])
                ->values()
                ->all();

            $bag->add('ai-revenue-chart', 'Revenue Over Time', 'Daily revenue', 'TrendingUp', 'chart', [
                'chartType' => 'line',
                'data' => $revenueByDay,
                'xKey' => 'date',
                'yKey' => 'value',
            ], 'finance', 20);

            // Invoice status breakdown chart
            $invoiceStatuses = Invoice::selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->get()
                ->map(fn ($row) => [
                    'name' => ucfirst($row->status instanceof \BackedEnum ? $row->status->value : (string) $row->status),
                    'value' => $row->count,
                ])
                ->values()
                ->all();

            $bag->add('ai-invoice-status', 'Invoice Status', 'Distribution by status', 'PieChart', 'chart', [
                'chartType' => 'pie',
                'data' => $invoiceStatuses,
            ], 'finance', 21);

            // Recent invoices table
            $recentInvoices = Invoice::with('client')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(fn ($inv) => [
                    'id' => $inv->id,
                    'number' => $inv->invoice_number,
                    'client' => trim(($inv->client?->first_name ?? '').' '.($inv->client?->last_name ?? '')) ?: '—',
                    'total' => (float) $inv->total,
                    'status' => $inv->status instanceof \BackedEnum ? $inv->status->value : (string) $inv->status,
                    'date' => $inv->created_at->toISOString(),
                ])
                ->all();

            $bag->add('ai-recent-invoices', 'Recent Invoices', 'Latest 10 invoices', 'List', 'table', [
                'columns' => ['Number', 'Client', 'Total', 'Status', 'Date'],
                'rows' => $recentInvoices,
            ], 'operations', 30);
        });

        Hook::dispatch(Hook::MODULE_BOOT, ['module' => 'ailes-invisibles']);
    }

    protected function loadModuleRoutes(): void
    {
        $router = $this->app['router'];

        // Register module middleware aliases
        $router->aliasMiddleware('auth.client', AuthenticateClient::class);

        $routesPath = $this->modulePath('routes'.DIRECTORY_SEPARATOR.'web.php');
        if (file_exists($routesPath)) {
            $router->middleware(['web', 'auth', 'verified', EnsureTeamMembership::class])
                ->prefix('{current_team}')
                ->group(function () use ($routesPath) {
                    require $routesPath;
                });
        }

        $portalPath = $this->modulePath('routes'.DIRECTORY_SEPARATOR.'portal.php');
        if (file_exists($portalPath)) {
            $router->middleware(['web', SharePortalInertiaData::class])->group(function () use ($portalPath) {
                require $portalPath;
            });
        }
    }
}
