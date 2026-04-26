<?php

namespace Modules\AilesInvisibles\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Modules\AilesInvisibles\Models\Client;
use Modules\AilesInvisibles\Models\Event;
use Modules\AilesInvisibles\Models\Invoice;
use Modules\AilesInvisibles\Models\PortalDocument;
use Modules\AilesInvisibles\Models\Product;
use Modules\AilesInvisibles\Models\Quote;
use Modules\AilesInvisibles\Services\DatabaseQueryService;

class DashboardController
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Client::class);

        $teamId = $request->user()->currentTeam->id;
        $db = app(DatabaseQueryService::class);

        $clientsCount = Client::where('team_id', $teamId)->count();
        $productsCount = Product::where('team_id', $teamId)->count();
        $eventsCount = Event::where('team_id', $teamId)->count();
        $quotesCount = Quote::where('team_id', $teamId)->count();
        $invoicesCount = Invoice::where('team_id', $teamId)->count();
        $documentsCount = PortalDocument::where('team_id', $teamId)->count();

        $unpaidTotal = (float) (Invoice::where('team_id', $teamId)
            ->whereIn('status', ['sent', 'partial', 'overdue'])
            ->selectRaw('COALESCE(SUM(total - paid_amount), 0) as total')
            ->value('total') ?? 0);

        $monthlyRevenue = (float) (Invoice::where('team_id', $teamId)
            ->whereIn('status', ['paid', 'partial'])
            ->where('issue_date', '>=', now()->startOfMonth())
            ->sum('paid_amount') ?? 0);

        $previousMonthRevenue = (float) (Invoice::where('team_id', $teamId)
            ->whereIn('status', ['paid', 'partial'])
            ->whereBetween('issue_date', [now()->subMonth()->startOfMonth(), now()->subMonth()->endOfMonth()])
            ->sum('paid_amount') ?? 0);

        $revenueTrend = $previousMonthRevenue > 0
            ? round((($monthlyRevenue - $previousMonthRevenue) / $previousMonthRevenue) * 100, 1)
            : ($monthlyRevenue > 0 ? 100 : 0);

        // Monthly revenue chart data (last 12 months)
        $monthlyData = Invoice::where('team_id', $teamId)
            ->whereIn('status', ['paid', 'partial'])
            ->where('issue_date', '>=', now()->subMonths(11)->startOfMonth())
            ->selectRaw($db->selectYearMonth('issue_date').', COALESCE(SUM(paid_amount), 0) as revenue')
            ->groupByRaw($db->groupByYearMonth('issue_date'))
            ->orderByRaw($db->orderByYearMonth('issue_date'))
            ->get()
            ->map(fn ($row) => [
                'month' => \DateTime::createFromFormat('!m', (int) $row->month)?->format('M').' '.$row->year,
                'revenue' => (float) $row->revenue,
            ]);

        // Client type distribution
        $clientTypes = Client::where('team_id', $teamId)
            ->selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type')
            ->toArray();

        // Invoice status distribution
        $invoiceStatuses = Invoice::where('team_id', $teamId)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        return Inertia::render('ailes-invisibles/admin/Dashboard', [
            'clientsCount' => $clientsCount,
            'productsCount' => $productsCount,
            'eventsCount' => $eventsCount,
            'quotesCount' => $quotesCount,
            'invoicesCount' => $invoicesCount,
            'documentsCount' => $documentsCount,
            'unpaidTotal' => $unpaidTotal,
            'monthlyRevenue' => $monthlyRevenue,
            'revenueTrend' => $revenueTrend,
            'monthlyData' => $monthlyData,
            'clientTypes' => [
                'pro' => (int) ($clientTypes['pro'] ?? 0),
                'individual' => (int) ($clientTypes['individual'] ?? 0),
            ],
            'invoiceStatuses' => [
                'paid' => (int) ($invoiceStatuses['paid'] ?? 0),
                'sent' => (int) ($invoiceStatuses['sent'] ?? 0),
                'overdue' => (int) ($invoiceStatuses['overdue'] ?? 0),
                'draft' => (int) ($invoiceStatuses['draft'] ?? 0),
                'cancelled' => (int) ($invoiceStatuses['cancelled'] ?? 0),
            ],
        ]);
    }
}
